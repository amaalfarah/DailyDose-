// src/lib/supabase.ts
// Copy this into your Expo project at src/lib/supabase.ts
// Install: npx expo install @supabase/supabase-js expo-secure-store

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// SecureStore is native-only — require it lazily so web doesn't choke on it
const storage = Platform.OS === 'web'
  ? undefined
  : (() => {
      const SecureStore = require('expo-secure-store');
      return {
        getItem:    (key: string) => SecureStore.getItemAsync(key),
        setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };
    })();

// ── Supabase client ───────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Guard against missing env vars — app still renders; DB calls will no-op.
function makeClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch {
    return null;
  }
}

export const supabase = makeClient()!;

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: username, username } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Medication helpers ────────────────────────────────────────────────────────

export async function getMedications(userId: string) {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addMedication(med: {
  user_id: string;
  name: string;
  cover_name?: string;
  dosage: string;
  frequency: string;
  reminder_times: string[];
  color: string;
  icon_name: string;
  icon_category: string;
  is_prn: boolean;
}) {
  const { data, error } = await supabase.from('medications').insert(med).select().single();
  if (error) throw error;
  return data;
}

export async function updateMedication(id: string, updates: Partial<{
  name: string; cover_name: string; dosage: string;
  frequency: string; reminder_times: string[];
  color: string; icon_name: string; is_prn: boolean; is_active: boolean;
}>) {
  const { error } = await supabase.from('medications').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteMedication(id: string) {
  const { error } = await supabase
    .from('medications')
    .update({ is_active: false })  // soft delete
    .eq('id', id);
  if (error) throw error;
}

// ── Dose log helpers ──────────────────────────────────────────────────────────

export async function logDose(medicationId: string, userId: string, opts?: {
  scheduledTime?: string;
  loggedBy?: string;
  notes?: string;
}) {
  const { data, error } = await supabase.from('dose_logs').insert({
    medication_id: medicationId,
    user_id: userId,
    logged_by: opts?.loggedBy || null,
    scheduled_time: opts?.scheduledTime,
    notes: opts?.notes,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getTodaysDoses(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('dose_logs')
    .select('*, medications(name, cover_name, color, icon_name)')
    .eq('user_id', userId)
    .gte('taken_at', `${today}T00:00:00`)
    .lte('taken_at', `${today}T23:59:59`)
    .order('taken_at', { ascending: true });
  if (error) throw error;
  return data;
}

// ── Caregiver invite helpers ──────────────────────────────────────────────────

export async function sendCaregiverInvite(opts: {
  caregiverName: string;
  caregiverEmail: string;
  permissions: string[];
}) {
  const { data, error } = await supabase.functions.invoke('send-caregiver-invite', {
    body: opts,
  });
  if (error) throw error;
  return data;
}

export async function getInviteByToken(token: string) {
  const { data, error } = await supabase
    .from('caregiver_invites')
    .select('*, users!patient_user_id(full_name)')
    .eq('token', token)
    .eq('status', 'pending')
    .single();
  if (error) throw error;
  return data;
}

export async function acceptInvite(token: string, caregiverUserId: string) {
  const { data, error } = await supabase
    .rpc('accept_caregiver_invite', {
      p_token: token,
      p_caregiver_user_id: caregiverUserId,
    });
  if (error) throw error;
  return data;
}

export async function getCaregiverPatients(caregiverUserId: string) {
  const { data, error } = await supabase
    .from('caregiver_relationships')
    .select('*, users!patient_user_id(id, full_name, email)')
    .eq('caregiver_user_id', caregiverUserId)
    .eq('status', 'active');
  if (error) throw error;
  return data;
}

// ── Realtime subscriptions ────────────────────────────────────────────────────

export function subscribeToDoseLogs(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`dose_logs:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'dose_logs',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .subscribe();
}

export function subscribeToMedications(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`medications:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'medications',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .subscribe();
}

// ── Username / email availability checks ─────────────────────────────────────

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (error) return true;
    return data === null;
  } catch {
    return true;
  }
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (error) return true;
    return data === null;
  } catch {
    return true;
  }
}

export async function getUserEmailByUsername(username: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('username', username)
    .maybeSingle();
  if (error || !data) return null;
  return data.email;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ── Subscription/trial helpers ────────────────────────────────────────────────

export async function getUserAccess(userId: string) {
  const { data, error } = await supabase
    .from('user_access')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function savePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);
  if (error) throw error;
}
