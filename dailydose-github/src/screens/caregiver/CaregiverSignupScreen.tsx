// screens/caregiver/CaregiverSignupScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useAuthStore } from '../../store/useAuthStore';

const EMAIL_RE = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(v: string): string {
  if (!v.trim()) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
}

export default function CaregiverSignupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const token = route.params?.token || '';
  const { acceptInvite, sharedPatientName } = useAuthStore();
  const patientName = sharedPatientName || 'your patient';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');

  const emailError = emailTouched ? validateEmail(email) : '';

  function handleCreate() {
    setEmailTouched(true);
    if (validateEmail(email)) return;
    acceptInvite(token, { id: Date.now().toString(), name: name || 'Sofia Santos', email, dob: '', emailVerified: false, type: 'caregiver' });
    navigation.navigate('AccountSwitcher');
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.inviteCard}>
          <Text style={s.inviteTitle}>You've been invited! 🎉</Text>
          <Text style={s.inviteSub}>Maria Santos has invited you to help manage {patientName}'s medications on DailyDose+.</Text>
          <View style={s.inviteFrom}>
            <View style={s.inviteAvatar}><Text style={s.inviteAvatarText}>MS</Text></View>
            <View>
              <Text style={s.inviteName}>Maria Santos</Text>
              <Text style={s.inviteRole}>Invited you to manage {patientName}'s account</Text>
            </View>
          </View>
        </View>
        <View style={s.pill}><Text style={s.pillText}>Step 1 — Create your account</Text></View>
        <Text style={s.note}>First, create your own personal DailyDose+ account. You'll then get access to {patientName}'s shared account automatically.</Text>
        <Text style={s.lbl}>Your full name</Text>
        <TextInput style={s.inp} placeholder="Sofia Santos" placeholderTextColor="#b0bec5" value={name} onChangeText={setName} autoCapitalize="words" />
        <Text style={s.lbl}>Email</Text>
        <TextInput
          style={[s.inp, { marginBottom: 4 }, emailError ? s.inpError : null]}
          placeholder="sofia@email.com"
          placeholderTextColor="#b0bec5"
          value={email}
          onChangeText={v => { setEmail(v); setEmailTouched(false); }}
          onBlur={() => setEmailTouched(true)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {emailError ? <Text style={s.fieldError}>{emailError}</Text> : null}
        <Text style={s.lbl}>Password</Text>
        <TextInput style={s.inp} placeholder="Min 8 characters" placeholderTextColor="#b0bec5" value={password} onChangeText={setPassword} secureTextEntry />
        <View style={{ height: 8 }} />
        <TouchableOpacity style={s.btn} onPress={handleCreate}>
          <Text style={s.btnText}>Create Account & Continue →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16 },
  inviteCard: { backgroundColor: colors.mintD, borderRadius: 18, padding: 18, marginBottom: 16 },
  inviteTitle: { fontSize: 16, fontFamily: fonts.bold, color: '#fff', marginBottom: 6 },
  inviteSub: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.85)', lineHeight: 16, marginBottom: 12 },
  inviteFrom: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10 },
  inviteAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  inviteAvatarText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: '#fff' },
  inviteName: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: '#fff' },
  inviteRole: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.8)' },
  pill: { alignSelf: 'flex-start', backgroundColor: colors.mintL, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  pillText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  note: { fontSize: fontSizes.xs, color: colors.muted, lineHeight: 16, marginBottom: 14 },
  lbl: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  inp: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy, marginBottom: 12 },
  inpError: { borderColor: colors.rose },
  fieldError: { fontSize: fontSizes.xs, color: colors.rose, marginBottom: 10, marginLeft: 2 },
  btn: { backgroundColor: colors.mint, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
});
