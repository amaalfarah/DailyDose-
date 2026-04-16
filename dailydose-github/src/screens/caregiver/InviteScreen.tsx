// screens/caregiver/InviteScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useAuthStore } from '../../store/useAuthStore';
import { generateInviteToken, shareInviteLink } from '../../utils/inviteLink';

export default function InviteScreen() {
  const navigation = useNavigation<any>();
  const { addCaregiver } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [canView, setView] = useState(true);
  const [canLog, setLog] = useState(true);
  const [canEdit, setEdit] = useState(false);

  async function sendInvite() {
    if (!email.trim()) return;
    const token = generateInviteToken();
    const perms = [
      canView && 'View medication schedule',
      canLog  && 'Mark doses as taken',
      canEdit && 'Edit medications',
    ].filter(Boolean) as string[];

    addCaregiver({ id: token, name: name || 'Caregiver', email, permissions: perms, status: 'pending', inviteToken: token, invitedAt: new Date().toISOString() });
    await shareInviteLink(token, name || 'Caregiver', 'Luis Santos');
    navigation.navigate('InviteSent', { caregiverName: name, caregiverEmail: email });
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <View style={s.backArr} /><Text style={s.backLabel}>Add Caregiver</Text>
        </TouchableOpacity>
        <View style={s.pill}><Text style={s.pillText}>Caregiver Access</Text></View>
        <Text style={s.note}>Invite a trusted person to help manage Luis's medications.</Text>
        <Text style={s.lbl}>Caregiver's name</Text>
        <TextInput style={s.inp} placeholder="e.g. Sofia Santos" placeholderTextColor="#b0bec5" value={name} onChangeText={setName} />
        <Text style={s.lbl}>Caregiver's email</Text>
        <TextInput style={s.inp} placeholder="sofia@email.com" placeholderTextColor="#b0bec5" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Text style={s.lbl}>Access permissions</Text>
        <TogRow label="View medication schedule" sub="See doses, times, and history" value={canView} onToggle={() => setView(!canView)} />
        <TogRow label="Mark doses as taken" sub="Log doses on Luis's behalf" value={canLog} onToggle={() => setLog(!canLog)} />
        <TogRow label="Edit medications" sub="Add, change, or remove meds" value={canEdit} onToggle={() => setEdit(!canEdit)} />
        <View style={{ height: 12 }} />
        <TouchableOpacity style={s.btn} onPress={sendInvite}><Text style={s.btnText}>Send invite link →</Text></TouchableOpacity>
        <TouchableOpacity style={s.btnOut} onPress={() => navigation.goBack()}><Text style={s.btnOutText}>Cancel</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TogRow({ label, sub, value, onToggle }: any) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.mint }} thumbColor="#fff" />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  backArr: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f0f4f3' },
  backLabel: { fontSize: 14, fontFamily: fonts.bold, color: colors.navy },
  pill: { alignSelf: 'flex-start', backgroundColor: colors.mintL, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  pillText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  note: { fontSize: fontSizes.xs, color: colors.muted, lineHeight: 16, marginBottom: 14 },
  lbl: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  inp: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 7, borderWidth: 1.5, borderColor: colors.border },
  rowLabel: { fontSize: fontSizes.base, fontFamily: fonts.medium, color: colors.navy },
  rowSub: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  btn: { backgroundColor: colors.mint, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
  btnOut: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center' },
  btnOutText: { color: colors.muted, fontFamily: fonts.medium, fontSize: fontSizes.base },
});
