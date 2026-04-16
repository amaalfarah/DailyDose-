// supabase/functions/schedule-reminder-check/index.ts
// Checks for upcoming doses and sends push notifications via Expo
// Schedule this to run every 5 minutes via Supabase CRON (pg_cron)
// Deploy: supabase functions deploy schedule-reminder-check

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // This can be triggered by a CRON job or called directly
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  // Find all active medications with a reminder in the next 5 minutes
  // and users who have push tokens
  const { data: medications, error } = await supabase
    .from('medications')
    .select(`
      id, name, cover_name, user_id,
      users!inner ( push_token, privacy_mode, language )
    `)
    .eq('is_active', true)
    .eq('is_prn', false)
    .overlaps('reminder_times', [currentTime]);  // check if current time is in reminder_times array

  if (error) {
    console.error('Error fetching medications:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!medications?.length) {
    return new Response(JSON.stringify({ sent: 0, message: 'No reminders due' }));
  }

  // Filter to users with push tokens
  const notifications = medications
    .filter((m: any) => m.users?.push_token)
    .map((m: any) => {
      const privacyMode = m.users.privacy_mode;
      const displayName = privacyMode
        ? (m.cover_name || getGenericText(m.users.language))
        : (m.cover_name || m.name);

      return {
        to: m.users.push_token,
        title: 'DailyDose+ 💊',
        body: getDoseReminderText(displayName, m.users.language),
        data: { medicationId: m.id, type: 'dose_reminder' },
        sound: 'default',
        priority: 'high',
        categoryId: 'dose_reminder',
      };
    });

  if (!notifications.length) {
    return new Response(JSON.stringify({ sent: 0, message: 'No users with push tokens' }));
  }

  // Send to Expo Push Service in batches of 100
  let totalSent = 0;
  for (let i = 0; i < notifications.length; i += 100) {
    const batch = notifications.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (res.ok) totalSent += batch.length;
    else console.error('Expo push error:', await res.text());
  }

  // Also check for missed doses (30 minutes past scheduled time)
  await checkMissedDoses(currentTime);

  return new Response(JSON.stringify({
    sent: totalSent,
    checked: medications.length,
    time: currentTime,
  }));
});

async function checkMissedDoses(currentTime: string) {
  // Get medications whose reminder was 30 minutes ago and have no dose log
  const [hours, minutes] = currentTime.split(':').map(Number);
  const thirtyMinAgo = new Date();
  thirtyMinAgo.setMinutes(thirtyMinAgo.getMinutes() - 30);
  const missedTime = `${String(thirtyMinAgo.getHours()).padStart(2,'0')}:${String(thirtyMinAgo.getMinutes()).padStart(2,'0')}`;

  const { data: missed } = await supabase
    .from('medications')
    .select(`
      id, name, cover_name, user_id,
      users!inner ( push_token, privacy_mode, language )
    `)
    .eq('is_active', true)
    .eq('is_prn', false)
    .overlaps('reminder_times', [missedTime]);

  if (!missed?.length) return;

  // Check which ones don't have a dose log in the last hour
  const today = new Date().toISOString().split('T')[0];
  const missedNotifications = [];

  for (const m of missed as any[]) {
    if (!m.users?.push_token) continue;

    const { count } = await supabase
      .from('dose_logs')
      .select('id', { count: 'exact', head: true })
      .eq('medication_id', m.id)
      .eq('skipped', false)
      .gte('taken_at', `${today}T${missedTime}:00`)
      .lte('taken_at', `${today}T${currentTime}:59`);

    if (count === 0) {
      const displayName = m.users.privacy_mode
        ? (m.cover_name || getGenericText(m.users.language))
        : (m.cover_name || m.name);

      missedNotifications.push({
        to: m.users.push_token,
        title: 'DailyDose+ — Missed dose',
        body: getMissedDoseText(displayName, m.users.language),
        data: { medicationId: m.id, type: 'missed_dose' },
        sound: 'default',
        priority: 'high',
      });
    }
  }

  if (missedNotifications.length) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missedNotifications),
    });
  }
}

function getDoseReminderText(name: string, lang: string): string {
  const texts: Record<string, string> = {
    en: `Time to take ${name}`,
    es: `Es hora de tomar ${name}`,
    fr: `Il est temps de prendre ${name}`,
    ar: `حان وقت تناول ${name}`,
  };
  return texts[lang] || texts.en;
}

function getMissedDoseText(name: string, lang: string): string {
  const texts: Record<string, string> = {
    en: `You missed your dose of ${name}`,
    es: `Olvidaste tu dosis de ${name}`,
    fr: `Vous avez manqué votre dose de ${name}`,
    ar: `لقد فاتتك جرعة ${name}`,
  };
  return texts[lang] || texts.en;
}

function getGenericText(lang: string): string {
  const texts: Record<string, string> = {
    en: 'your medication',
    es: 'tu medicamento',
    fr: 'votre médicament',
    ar: 'دوائك',
  };
  return texts[lang] || texts.en;
}
