// src/lib/supabase.ts
// Copy this into your Expo project at src/lib/supabase.ts
// Install: npx expo install @supabase/supabase-js expo-secure-store

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ── Secure token storage (uses iOS Keychain / Android Keystore) ──────────────
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// On web, fall back to localStorage
const storage = Platform.OS === 'web'
  ? undefined
  : ExpoSecureStoreAdapter;

// ── Supabase client ───────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
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
