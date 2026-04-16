// supabase/functions/send-caregiver-invite/index.ts
// Supabase Edge Function — triggered by app to send caregiver invite email
// Deploy: supabase functions deploy send-caregiver-invite

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL        = Deno.env.get('APP_URL') || 'https://dailydoseplus.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { caregiverName, caregiverEmail, permissions } = await req.json();
    if (!caregiverEmail) throw new Error('caregiverEmail is required');

    // Get patient profile
    const { data: patient } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const patientName = patient?.full_name || 'Your family member';

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from('caregiver_invites')
      .insert({
        patient_user_id: user.id,
        caregiver_email: caregiverEmail,
        caregiver_name: caregiverName || 'Caregiver',
        permissions: permissions || ['view', 'log'],
      })
      .select('token, expires_at')
      .single();

    if (inviteError) throw inviteError;

    const inviteUrl = `${APP_URL}/invite/${invite.token}`;
    const expiryDate = new Date(invite.expires_at).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'DailyDose+ <noreply@dailydoseplus.app>',
        to: `${caregiverName} <${caregiverEmail}>`,
        subject: `${patientName} invited you to DailyDose+`,
        html: buildEmailHtml({
          caregiverName: caregiverName || 'Caregiver',
          patientName,
          permissions: permissions || ['view', 'log'],
          inviteUrl,
          expiryDate,
        }),
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error('Resend error:', errBody);
      // Don't fail the whole request — invite was created, email failed
    }

    return new Response(JSON.stringify({
      success: true,
      token: invite.token,
      inviteUrl,
      expiresAt: invite.expires_at,
      message: `Invite sent to ${caregiverEmail}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildEmailHtml(opts: {
  caregiverName: string;
  patientName: string;
  permissions: string[];
  inviteUrl: string;
  expiryDate: string;
}) {
  const permLabels: Record<string, string> = {
    view: 'View medication schedule',
    log:  'Mark doses as taken',
    edit: 'Edit medications',
  };

  const permItems = opts.permissions
    .map(p => `<li style="margin:4px 0;color:#0f1f2e">${permLabels[p] || p}</li>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7fbf9;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto">
    <div style="background:linear-gradient(135deg,#0d6e51,#1fa97a);border-radius:16px;padding:32px 28px;text-align:center;margin-bottom:24px">
      <div style="font-size:48px;margin-bottom:12px">💊</div>
      <h1 style="color:#fff;font-size:24px;margin:0 0 8px">You've been invited!</h1>
      <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px">
        <strong>${opts.patientName}</strong> has invited you to help manage their medications on DailyDose+.
      </p>
    </div>

    <div style="background:#fff;border-radius:12px;padding:20px 24px;margin-bottom:16px;border:1.5px solid #dde8e3">
      <h3 style="color:#0d6e51;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Your access includes</h3>
      <ul style="margin:0;padding-left:20px">${permItems}</ul>
    </div>

    <div style="text-align:center;margin-bottom:24px">
      <a href="${opts.inviteUrl}"
         style="display:inline-block;background:#1fa97a;color:#fff;text-decoration:none;
                padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px">
        Accept Invitation →
      </a>
    </div>

    <p style="font-size:12px;color:#5f7080;text-align:center;line-height:1.6">
      This link expires on <strong>${opts.expiryDate}</strong>.<br>
      If you didn't expect this email, you can safely ignore it.
    </p>

    <p style="font-size:11px;color:#b0bec5;text-align:center;margin-top:24px">
      DailyDose+ · Medication tracking for families
    </p>
  </div>
</body>
</html>`;
}
