// screens/auth/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useAuthStore } from '../../store/useAuthStore';
import TCModal from '../../components/TCModal';
import { AuthStackParams } from '../../navigation/AppNavigator';

type Nav = StackNavigationProp<AuthStackParams, 'SignUp'>;

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { acceptTerms } = useAuthStore();

  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [dob, setDob]               = useState('');
  const [showTC, setShowTC]         = useState(false);

  function handleSignUp() {
    if (!email.trim()) return;
    setShowTC(true);
  }

  function handleAcceptTC() {
    setShowTC(false);
    acceptTerms();
    // TrialModal will appear automatically via App.tsx logic
    navigation.navigate('AddMedication');
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
          <View style={styles.header}>
            <Text style={styles.logo}>
              Daily<Text style={styles.logoAccent}>Dose</Text>+
            </Text>
          </View>

          {/* Step pill */}
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Step 1 of 4 — Account</Text>
          </View>

          {/* Form */}
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Maria Santos"
            placeholderTextColor="#b0bec5"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="maria@email.com"
            placeholderTextColor="#b0bec5"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#b0bec5"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Date of birth</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#b0bec5"
            value={dob}
            onChangeText={setDob}
            keyboardType="numeric"
          />

          <Text style={styles.caregiverNote}>
            Already have an account with a caregiver?
          </Text>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSignUp}>
            <Text style={styles.btnPrimaryText}>Sign up →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Log in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* T&C Modal */}
      <TCModal
        visible={showTC}
        onDecline={() => setShowTC(false)}
        onAccept={handleAcceptTC}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
    marginBottom: 12,
  },
  caregiverNote: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginBottom: 14,
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
