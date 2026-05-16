// screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { AuthStackParams } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { getUserEmailByUsername, signIn, getProfile } from '../../lib/supabase';

type Nav = StackNavigationProp<AuthStackParams, 'Login'>;

// ── Same validators as SignUpScreen ───────────────────────────────────────────

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123',
  '12345678', '123456789', '1234567890', 'qwerty123',
  'iloveyou1', 'admin1234', 'letmein1!', 'welcome1!', 'monkey123',
]);

function validateUsername(v: string): string {
  if (!v) return 'Username is required';
  if (v.length < 3) return 'Must be at least 3 characters';
  if (v.length > 20) return 'Must be 20 characters or less';
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) return 'Only letters, numbers, _ and - allowed';
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

// ── Screen ────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuthStore();

  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched]           = useState<Record<string, boolean>>({});
  const [loading, setLoading]           = useState(false);
  const [serverError, setServerError]   = useState('');

  function touch(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  const usernameError = touched.username ? validateUsername(username) : '';
  const passwordError = touched.password ? validatePassword(password) : '';

  function dividerColor(field: 'username' | 'password', error: string) {
    if (!touched[field]) return colors.border;
    return error ? colors.rose : colors.mint;
  }

  async function handleLogin() {
    setTouched({ username: true, password: true });
    setServerError('');
    if (validateUsername(username) || validatePassword(password)) return;

    setLoading(true);
    try {
      const email = await getUserEmailByUsername(username);
      if (!email) {
        setServerError('Account not found.');
        return;
      }

      const { user } = await signIn(email, password);
      if (!user) {
        setServerError('Login failed. Please try again.');
        return;
      }

      const profile = await getProfile(user.id);
      login({
        id: user.id,
        name: profile.username ?? profile.full_name,
        email: profile.email,
        dob: profile.date_of_birth ?? '',
        emailVerified: !!user.email_confirmed_at,
        type: 'primary',
      });
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.toLowerCase().includes('invalid login')) {
        setServerError('Incorrect password.');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setServerError('Please verify your email before logging in.');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    navigation.navigate('ForgotPassword');
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
            <Text style={styles.title}>Login</Text>

            {/* Username */}
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={usernameError ? colors.rose : colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Type your username"
                placeholderTextColor="#b0bec5"
                value={username}
                onChangeText={setUsername}
                onBlur={() => touch('username')}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: dividerColor('username', usernameError) }]} />
            {usernameError ? <Text style={styles.fieldError}>{usernameError}</Text> : null}

            {/* Password */}
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={passwordError ? colors.rose : colors.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Type your password"
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
            <View style={[styles.divider, { backgroundColor: dividerColor('password', passwordError) }]} />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotRow} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Server error */}
            {serverError ? (
              <Text style={styles.serverError}>{serverError}</Text>
            ) : null}

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.loginBtnText}>LOGIN</Text>
              }
            </TouchableOpacity>

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupPrompt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },

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
    marginBottom: 28,
    letterSpacing: -0.5,
  },

  fieldLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 16,
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
  },
  divider: {
    height: 1.5,
    marginTop: 4,
  },
  fieldError: {
    fontSize: fontSizes.xs,
    color: colors.rose,
    marginTop: 4,
    marginLeft: 30,
  },

  serverError: {
    fontSize: fontSizes.sm,
    color: colors.rose,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 14,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.mint,
  },

  loginBtn: {
    backgroundColor: colors.mint,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    letterSpacing: 2,
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupPrompt: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.muted,
  },
  signupLink: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bold,
    color: colors.mint,
  },
});
