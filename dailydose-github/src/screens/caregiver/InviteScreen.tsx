// screens/caregiver/InviteScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useAuthStore } from '../../store/useAuthStore';
import { generateInviteToken, shareInviteLink } from '../../utils/inviteLink';

const EMAIL_RE = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(v: string): string {
  if (!v.trim()) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
}

export default function InviteScreen() {
  const navigation = useNavigation<any>();
  const { addCaregiver } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [canView, setView] = useState(true);
  const [canLog, setLog] = useState(true);
  const [canEdit, setEdit] = useState(false);
  const [notifyDoseTaken, setNotifyDoseTaken] = useState(true);
  const [notifyMissedDose, setNotifyMissedDose] = useState(true);
  const [notifyUpcoming, setNotifyUpcoming] = useState(false);

  const emailError = emailTouched ? validateEmail(email) : '';

  async function sendInvite() {
    setEmailTouched(true);
    if (validateEmail(email)) return;
    const token = generateInviteToken();
    const perms = [
      canView && 'View medication schedule',
      canLog  && 'Mark doses as taken',
      canEdit && 'Edit medications',
    ].filter(Boolean) as string[];

    addCaregiver({ id: token, name: name || 'Caregiver', email, permissions: perms, status: 'pending', inviteToken: token, invitedAt: new Date().toISOString() });
    await shareInviteLink(token, name || 'Caregiver');
    navigation.navigate('InviteSent', { caregiverName: name, caregiverEmail: email });
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backArr}>‹</Text>
          <Text style={s.backLabel}>Add Caregiver</Text>
        </TouchableOpacity>

        {/* Badge */}
        <View style={s.pill}><Text style={s.pillText}>Caregiver Access</Text></View>

        {/* Description */}
        <Text style={s.note}>
          Invite a trusted person to help manage your medications. They'll create their own account and can switch between their personal dashboard and your shared account.
        </Text>

        {/* Name */}
        <Text style={s.lbl}>Caregiver's Name</Text>
        <TextInput
          style={s.inp}
          placeholder="e.g. Sofia Santos"
          placeholderTextColor="#b0bec5"
          value={name}
          onChangeText={setName}
        />

        {/* Email */}
        <Text style={s.lbl}>Caregiver's Email</Text>
        <TextInput
          style={[s.inp, s.inpEmail, emailError ? s.inpError : null]}
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

        {/* Access Permissions */}
        <Text style={s.lbl}>Access Permissions</Text>
        <TogRow label="View medication schedule" sub="See doses, times, and history" value={canView} onToggle={() => setView(!canView)} />
        <TogRow label="Mark doses as taken" sub="Log doses on your behalf" value={canLog} onToggle={() => setLog(!canLog)} />
        <TogRow label="Edit medications" sub="Add, change, or remove meds" value={canEdit} onToggle={() => setEdit(!canEdit)} />

        {/* Notification Permissions */}
        <View style={s.notifHeader}>
          <Text style={s.lbl}>Notification Permissions</Text>
          <View style={s.controlledBadge}>
            <Text style={s.controlledText}>PATIENT-CONTROLLED</Text>
          </View>
        </View>
        <Text style={s.notifDesc}>
          Choose which alerts the caregiver receives. They can further opt out in their own settings.
        </Text>
        <NotifRow
          label="Dose taken alerts"
          sub="Notify caregiver when a dose is logged"
          value={notifyDoseTaken}
          onToggle={() => setNotifyDoseTaken(!notifyDoseTaken)}
          accent={colors.blueD}
          bg={colors.blueL}
          border="#c5d9ef"
        />
        <NotifRow
          label="Missed dose alerts"
          sub="Notify caregiver if a dose is not logged on time"
          value={notifyMissedDose}
          onToggle={() => setNotifyMissedDose(!notifyMissedDose)}
          accent={colors.rose}
          bg={colors.roseL}
          border="#f2c8d3"
        />
        <NotifRow
          label="Upcoming dose reminders"
          sub="Remind caregiver 15 min before scheduled dose"
          value={notifyUpcoming}
          onToggle={() => setNotifyUpcoming(!notifyUpcoming)}
          accent={colors.amberD}
          bg={colors.amberL}
          border="#f5ddb8"
        />

        <View style={{ height: 16 }} />
        <TouchableOpacity style={s.btn} onPress={sendInvite}>
          <Text style={s.btnText}>Send invite link and code →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnOut} onPress={() => navigation.goBack()}>
          <Text style={s.btnOutText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TogRow({ label, sub, value, onToggle }: { label: string; sub: string; value: boolean; onToggle: () => void }) {
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

function NotifRow({ label, sub, value, onToggle, accent, bg, border }: {
  label: string; sub: string; value: boolean; onToggle: () => void;
  accent: string; bg: string; border: string;
}) {
  return (
    <View style={[s.row, { backgroundColor: bg, borderColor: border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: accent }]}>{label}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.mint }} thumbColor="#fff" />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  backArr: { fontSize: 28, color: colors.navy, lineHeight: 32, marginTop: -2 },
  backLabel: { fontSize: fontSizes.md, fontFamily: fonts.bold, color: colors.navy },
  pill: { alignSelf: 'flex-start', backgroundColor: colors.mintL, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  pillText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  note: { fontSize: fontSizes.xs, color: colors.muted, lineHeight: 18, marginBottom: 16 },
  lbl: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  inp: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy, marginBottom: 14 },
  inpEmail: { marginBottom: 4 },
  inpError: { borderColor: colors.rose },
  fieldError: { fontSize: fontSizes.xs, color: colors.rose, marginBottom: 10, marginLeft: 2 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 7, borderWidth: 1.5, borderColor: colors.border },
  rowLabel: { fontSize: fontSizes.base, fontFamily: fonts.medium, color: colors.navy },
  rowSub: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 6 },
  controlledBadge: { backgroundColor: '#e8edf5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  controlledText: { fontSize: 9, fontFamily: fonts.bold, color: colors.blueD, letterSpacing: 0.6 },
  notifDesc: { fontSize: fontSizes.xs, color: colors.muted, lineHeight: 16, marginBottom: 8 },
  btn: { backgroundColor: colors.mint, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
  btnOut: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center' },
  btnOutText: { color: colors.muted, fontFamily: fonts.medium, fontSize: fontSizes.base },
});
