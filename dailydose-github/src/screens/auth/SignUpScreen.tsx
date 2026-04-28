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
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  if (!/^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)) return 'Enter a valid email address';
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

// ── Async status indicator ────────────────────────────────────────────────────

function FieldStatus({
  localError, asyncStatus, takenMessage,
}: {
  localError: string; asyncStatus: AsyncStatus; takenMessage: string;
}) {
  if (localError) return <Text style={styles.errorText}>{localError}</Text>;
  if (asyncStatus === 'checking')
    return (
      <View style={styles.statusRow}>
        <ActivityIndicator size="small" color={colors.muted} />
        <Text style={styles.checkingText}> Checking…</Text>
      </View>
    );
  if (asyncStatus === 'taken') return <Text style={styles.errorText}>{takenMessage}</Text>;
  if (asyncStatus === 'available') return <Text style={styles.successText}>Available ✓</Text>;
  return null;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { acceptTerms, setPendingUser, setSavedCaregiverCode, setPendingInviteToken } = useAuthStore();
  const { openTrialModal } = useSettingsStore();

  const [username, setUsername]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dob, setDob]                   = useState('');
  const [caregiverCode, setCaregiverCode] = useState('');
  const [showTC, setShowTC]             = useState(false);
  const [touched, setTouched]           = useState<Record<string, boolean>>({});
  const [usernameStatus, setUsernameStatus] = useState<AsyncStatus>('idle');
  const [emailStatus, setEmailStatus]       = useState<AsyncStatus>('idle');

  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setPendingUser(username, email, dob);
    if (caregiverCode.trim()) {
      setSavedCaregiverCode(caregiverCode.trim());
      setPendingInviteToken(caregiverCode.trim());
    }
    acceptTerms();
    openTrialModal();
    navigation.navigate('AddMedication');
  }

  function handleGoToLogin() {
    setUsername(''); setEmail(''); setPassword(''); setDob(''); setCaregiverCode('');
    setTouched({});
    setUsernameStatus('idle'); setEmailStatus('idle');
    navigation.navigate('Login');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Text style={styles.logo}>
            Daily<Text style={styles.logoAccent}>Dose</Text>+
          </Text>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Sign Up</Text>

            {/* Username */}
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={touched.username && validateUsername(username) ? colors.rose : colors.muted}
                style={styles.inputIcon}
              />
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
            </View>
            <FieldStatus
              localError={touched.username ? validateUsername(username) : ''}
              asyncStatus={usernameStatus}
              takenMessage="Username is already taken"
            />

            {/* Email */}
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={touched.email && validateEmail(email) ? colors.rose : colors.muted}
                style={styles.inputIcon}
              />
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
            </View>
            <FieldStatus
              localError={touched.email ? validateEmail(email) : ''}
              asyncStatus={emailStatus}
              takenMessage="Email is already registered"
            />

            {/* Password */}
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={touched.password && validatePassword(password) ? colors.rose : colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }, borderStyle('password')]}
                placeholder="••••••••"
                placeholderTextColor="#b0bec5"
                value={password}
                onChangeText={setPassword}
                onBlur={() => touch('password')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                maxLength={12}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            {touched.password && validatePassword(password)
              ? <Text style={styles.errorText}>{validatePassword(password)}</Text>
              : null}
            {touched.password && !validatePassword(password)
              ? <Text style={styles.successText}>Strong password ✓</Text>
              : null}

            {/* Date of birth */}
            <Text style={styles.fieldLabel}>Date of birth</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={20}
                color={touched.dob && validateDob(dob) ? colors.rose : colors.muted}
                style={styles.inputIcon}
              />
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
            </View>
            {touched.dob && validateDob(dob)
              ? <Text style={styles.errorText}>{validateDob(dob)}</Text>
              : null}
            {touched.dob && !validateDob(dob)
              ? <Text style={styles.successText}>Valid date ✓</Text>
              : null}

            {/* Caregiver Code (optional) */}
            <View style={styles.caregiverLabelRow}>
              <Text style={[styles.fieldLabel, { marginTop: 0, marginBottom: 0 }]}>Caregiver Code</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="key-outline"
                size={20}
                color={colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter code if you received one"
                placeholderTextColor="#b0bec5"
                value={caregiverCode}
                onChangeText={setCaregiverCode}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
              />
            </View>

            {/* Sign up button */}
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSignUp} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>SIGN UP</Text>
            </TouchableOpacity>

            {/* Log in link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={handleGoToLogin}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  logo: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.navy,
    letterSpacing: -0.4,
    marginBottom: 28,
    textAlign: 'center',
  },
  logoAccent: { color: colors.mint },

  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },

  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },

  fieldLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
  },
  inputIcon: { marginRight: 10 },

  input: {
    flex: 1,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.navy,
    paddingVertical: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  inputError: { borderBottomColor: colors.rose },
  inputValid:  { borderBottomColor: colors.mint },

  errorText: {
    fontSize: fontSizes.xs,
    color: colors.rose,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 30,
  },
  successText: {
    fontSize: fontSizes.xs,
    color: colors.mint,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 30,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 30,
  },
  checkingText: {
    fontSize: fontSizes.xs,
    color: colors.muted,
  },

  caregiverLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  optionalBadge: {
    fontSize: fontSizes.xs - 1,
    fontFamily: fonts.medium,
    color: colors.muted,
    backgroundColor: '#f0f4f3',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  btnPrimary: {
    backgroundColor: colors.mint,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPrimaryText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    letterSpacing: 2,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginPrompt: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.muted,
  },
  loginLink: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bold,
    color: colors.mint,
  },
});
