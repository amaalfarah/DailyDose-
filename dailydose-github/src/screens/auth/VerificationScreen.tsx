// screens/auth/VerificationScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { AuthStackParams } from '../../navigation/AppNavigator';

type Nav   = StackNavigationProp<AuthStackParams, 'Verification'>;
type Route = { params: { email: string } };

export default function VerificationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<any>() as Route;

  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError]   = useState('');

  // One ref per box — avoids calling useRef inside a loop
  const ref0 = useRef<TextInput>(null);
  const ref1 = useRef<TextInput>(null);
  const ref2 = useRef<TextInput>(null);
  const ref3 = useRef<TextInput>(null);
  const inputRefs = [ref0, ref1, ref2, ref3];

  function handleChange(index: number, value: string) {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next  = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < 3) inputRefs[index + 1].current?.focus();
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  function handleSend() {
    const code = digits.join('');
    if (code.length < 4) {
      setError('Please enter all 4 digits.');
      return;
    }
    navigation.navigate('NewPassword', { email: params.email });
  }

  function handleResend() {
    setDigits(['', '', '', '']);
    setError('');
    inputRefs[0].current?.focus();
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
            <Text style={styles.title}>Verification</Text>

            <Text style={styles.sectionLabel}>Enter Verification Code</Text>
            <Text style={styles.sentTo}>Sent to {params.email}</Text>

            {/* OTP boxes */}
            <View style={styles.otpRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={inputRefs[i]}
                  style={[styles.otpBox, d ? styles.otpBoxFilled : null, error ? styles.otpBoxError : null]}
                  value={d}
                  onChangeText={v => handleChange(i, v)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={styles.resendPrompt}>If you didn't receive a code, </Text>
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleSend} activeOpacity={0.85}>
              <Text style={styles.btnText}>Verify</Text>
            </TouchableOpacity>

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
    marginBottom: 20,
    letterSpacing: -0.4,
  },

  sectionLabel: {
    fontSize: fontSizes.md,
    fontFamily: fonts.bold,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  sentTo: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 8,
  },
  otpBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.navy,
    textAlign: 'center',
  },
  otpBoxFilled: { borderColor: colors.mint, backgroundColor: colors.mintL },
  otpBoxError:  { borderColor: colors.rose },

  errorText: {
    fontSize: fontSizes.xs,
    color: colors.rose,
    textAlign: 'center',
    marginBottom: 4,
  },

  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  resendPrompt: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
    color: colors.muted,
  },
  resendLink: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.mint,
  },

  btn: {
    backgroundColor: colors.mint,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
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
