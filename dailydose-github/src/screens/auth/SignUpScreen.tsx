// screens/auth/SignUpScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import TCModal from '../../components/TCModal';
import { AuthStackParams } from '../../navigation/AppNavigator';
import { checkUsernameAvailable, checkEmailAvailable } from '../../lib/supabase';

type Nav = StackNavigationProp<AuthStackParams, 'SignUp'>;

type AsyncStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123',
  '12345678', '123456789', '1234567890', 'qwerty123',
  'iloveyou1', 'admin1234', 'letmein1!', 'welcome1!', 'monkey123',
]);

// ── Validators ────────────────────────────────────────────────────────────────

function validateUsername(v: string): string {
  if (!v) return 'Username is required';
  if (v.length < 3) return 'Must be at least 3 characters';
  if (v.length > 20) return 'Must be 20 characters or less';
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) return 'Only letters, numbers, _ and - allowed';
  return '';
}

function validateEmail(v: string): string {
  if (!v) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
  return '';
}

function validatePassword(v: string): string {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Must be at least 8 characters';
  if (v.length > 12) return 'Must be 12 characters or less';
  if (!/[A-Z]/.test(v)) return 'Needs an uppercase letter';
  if (!/[a-z]/.test(v)) return 'Needs a lowercase letter';
  if (!/[0-9]/.test(v)) return 'Needs a number';
  if (!/[@#$!%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(v))
    return 'Needs a special character (@, #, $, !, etc.)';
  if (COMMON_PASSWORDS.has(v.toLowerCase())) return 'This password is too common';
  return '';
}

function validateDob(v: string): string {
  if (!v) return 'Date of birth is required';
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return 'Enter date as MM/DD/YYYY';
  const [mm, dd, yyyy] = v.split('/').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  if (
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd ||
    date.getFullYear() !== yyyy
  ) return 'Enter a valid date';
  const today = new Date();
  if (date > today) return 'Date cannot be in the future';
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  if (age < 13) return 'Must be at least 13 years old (COPPA)';
  return '';
}

function formatDob(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// ── Inline status row (checking / taken / available) ─────────────────────────

function FieldStatus({
  localError,
  asyncStatus,
  takenMessage,
}: {
  localError: string;
  asyncStatus: AsyncStatus;
  takenMessage: string;
}) {
  if (localError) return <Text style={styles.errorText}>{localError}</Text>;
  if (asyncStatus === 'checking')
    return (
      <View style={styles.statusRow}>
        <ActivityIndicator size="small" color={colors.muted} />
        <Text style={styles.checkingText}> Checking…</Text>
      </View>
    );
  if (asyncStatus === 'taken')
    return <Text style={styles.errorText}>{takenMessage}</Text>;
  if (asyncStatus === 'available')
    return <Text style={styles.successText}>Available ✓</Text>;
  return null;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { acceptTerms } = useAuthStore();
  const { openTrialModal } = useSettingsStore();

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob]           = useState('');
  const [showTC, setShowTC]     = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [usernameStatus, setUsernameStatus] = useState<AsyncStatus>('idle');
  const [emailStatus, setEmailStatus]       = useState<AsyncStatus>('idle');

  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced username uniqueness check
  useEffect(() => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (validateUsername(username)) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      try {
        const ok = await checkUsernameAvailable(username);
        setUsernameStatus(ok ? 'available' : 'taken');
      } catch { setUsernameStatus('error'); }
    }, 600);
    return () => { if (usernameTimer.current) clearTimeout(usernameTimer.current); };
  }, [username]);

  // Debounced email uniqueness check
  useEffect(() => {
    if (emailTimer.current) clearTimeout(emailTimer.current);
    if (validateEmail(email)) { setEmailStatus('idle'); return; }
    setEmailStatus('checking');
    emailTimer.current = setTimeout(async () => {
      try {
        const ok = await checkEmailAvailable(email);
        setEmailStatus(ok ? 'available' : 'taken');
      } catch { setEmailStatus('error'); }
    }, 600);
    return () => { if (emailTimer.current) clearTimeout(emailTimer.current); };
  }, [email]);

  function touch(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  function borderStyle(field: 'username' | 'email' | 'password' | 'dob') {
    if (!touched[field]) return null;
    const localErr = {
      username: validateUsername(username),
      email:    validateEmail(email),
      password: validatePassword(password),
      dob:      validateDob(dob),
    }[field];
    const asyncErr =
      (field === 'username' && usernameStatus === 'taken') ||
      (field === 'email'    && emailStatus    === 'taken');
    if (localErr || asyncErr) return styles.inputError;
    if (field === 'username' && usernameStatus !== 'available') return null;
    if (field === 'email'    && emailStatus    !== 'available') return null;
    return styles.inputValid;
  }

  function handleSignUp() {
    setTouched({ username: true, email: true, password: true, dob: true });
    const hasErrors =
      validateUsername(username) ||
      validateEmail(email) ||
      validatePassword(password) ||
      validateDob(dob);
    if (hasErrors) return;
    if (usernameStatus === 'taken' || emailStatus === 'taken') return;
    if (usernameStatus === 'checking' || emailStatus === 'checking') return;
    setShowTC(true);
  }

  function handleAcceptTC() {
    setShowTC(false);
    acceptTerms();
    openTrialModal();
    navigation.navigate('AddMedication');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.header}>
            <Text style={styles.logo}>
              Daily<Text style={styles.logoAccent}>Dose</Text>+
            </Text>
          </View>

          {/* Step pill */}
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Step 1 of 4 — Account</Text>
          </View>

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[styles.input, borderStyle('username')]}
            placeholder="maria_santos"
            placeholderTextColor="#b0bec5"
            value={username}
            onChangeText={setUsername}
            onBlur={() => touch('username')}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          <FieldStatus
            localError={touched.username ? validateUsername(username) : ''}
            asyncStatus={usernameStatus}
            takenMessage="Username is already taken"
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, borderStyle('email')]}
            placeholder="maria@email.com"
            placeholderTextColor="#b0bec5"
            value={email}
            onChangeText={setEmail}
            onBlur={() => touch('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FieldStatus
            localError={touched.email ? validateEmail(email) : ''}
            asyncStatus={emailStatus}
            takenMessage="Email is already registered"
          />

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, borderStyle('password')]}
            placeholder="••••••••"
            placeholderTextColor="#b0bec5"
            value={password}
            onChangeText={setPassword}
            onBlur={() => touch('password')}
            secureTextEntry
            autoCapitalize="none"
            maxLength={12}
          />
          {touched.password && validatePassword(password) ? (
            <Text style={styles.errorText}>{validatePassword(password)}</Text>
          ) : null}
          {touched.password && !validatePassword(password) ? (
            <Text style={styles.successText}>Strong password ✓</Text>
          ) : null}

          {/* Date of birth */}
          <Text style={styles.label}>Date of birth</Text>
          <TextInput
            style={[styles.input, borderStyle('dob')]}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#b0bec5"
            value={dob}
            onChangeText={t => setDob(formatDob(t))}
            onBlur={() => touch('dob')}
            keyboardType="numeric"
            maxLength={10}
          />
          {touched.dob && validateDob(dob) ? (
            <Text style={styles.errorText}>{validateDob(dob)}</Text>
          ) : null}
          {touched.dob && !validateDob(dob) ? (
            <Text style={styles.successText}>Valid date ✓</Text>
          ) : null}

          <Text style={styles.caregiverNote}>
            Already have an account with a caregiver?
          </Text>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSignUp}>
            <Text style={styles.btnPrimaryText}>Sign up →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnSecondaryText}>Log in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <TCModal
        visible={showTC}
        onDecline={() => setShowTC(false)}
        onAccept={handleAcceptTC}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  logo: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.navy,
    letterSpacing: -0.4,
  },
  logoAccent: { color: colors.mint },
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mintL,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  stepPillText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.mintD,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.navy,
    marginBottom: 4,
  },
  inputError: { borderColor: colors.rose },
  inputValid: { borderColor: colors.mint },
  errorText: {
    fontSize: fontSizes.xs,
    color: colors.rose,
    marginBottom: 10,
    marginLeft: 2,
  },
  successText: {
    fontSize: fontSizes.xs,
    color: colors.mint,
    marginBottom: 10,
    marginLeft: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkingText: {
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
  caregiverNote: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginBottom: 14,
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnPrimaryText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    letterSpacing: 0.3,
  },
  btnSecondary: {
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
  },
});
