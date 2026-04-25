// screens/auth/NewPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { AuthStackParams } from '../../navigation/AppNavigator';

type Nav = StackNavigationProp<AuthStackParams, 'NewPassword'>;

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123',
  '12345678', '123456789', '1234567890', 'qwerty123',
  'iloveyou1', 'admin1234', 'letmein1!', 'welcome1!', 'monkey123',
]);

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

export default function NewPasswordScreen() {
  const navigation = useNavigation<Nav>();

  const [newPass, setNewPass]         = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched]         = useState<Record<string, boolean>>({});

  function touch(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  const newPassError  = touched.newPass  ? validatePassword(newPass) : '';
  const confirmError  = touched.confirm
    ? (!confirm ? 'Please confirm your password'
      : confirm !== newPass ? 'Passwords do not match' : '')
    : '';

  function handleSend() {
    setTouched({ newPass: true, confirm: true });
    if (validatePassword(newPass)) return;
    if (!confirm || confirm !== newPass) return;
    // TODO: wire up supabase.auth.updateUser({ password: newPass })
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
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
          </TouchableOpacity>

          {/* Logo */}
          <Text style={styles.logo}>
            Daily<Text style={styles.logoAccent}>Dose</Text>+
          </Text>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>New Password</Text>

            {/* New password */}
            <Text style={styles.fieldLabel}>Enter New Password</Text>
            <View style={[styles.inputRow, newPassError ? styles.inputRowError : null]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="At least 8 characters"
                placeholderTextColor="#b0bec5"
                value={newPass}
                onChangeText={setNewPass}
                onBlur={() => touch('newPass')}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                maxLength={12}
              />
              <TouchableOpacity onPress={() => setShowNew(p => !p)}>
                <MaterialCommunityIcons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            {newPassError ? <Text style={styles.errorText}>{newPassError}</Text> : null}

            {/* Confirm password */}
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <View style={[styles.inputRow, confirmError ? styles.inputRowError : null]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Re-enter password"
                placeholderTextColor="#b0bec5"
                value={confirm}
                onChangeText={setConfirm}
                onBlur={() => touch('confirm')}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                maxLength={12}
              />
              <TouchableOpacity onPress={() => setShowConfirm(p => !p)}>
                <MaterialCommunityIcons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

            <TouchableOpacity style={styles.btn} onPress={handleSend} activeOpacity={0.85}>
              <Text style={styles.btnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  backBtn: { marginBottom: 8 },

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
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.4,
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
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 4,
  },
  inputRowError: { borderColor: colors.rose },

  input: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.navy,
    paddingVertical: 9,
  },

  errorText: {
    fontSize: fontSizes.xs,
    color: colors.rose,
    marginBottom: 4,
    marginLeft: 6,
  },

  btn: {
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
  btnText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    letterSpacing: 1.5,
  },
});
