// screens/caregiver/SharedDashboardScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useMedStore } from '../../store/useMedStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function SharedDashboardScreen() {
  const navigation = useNavigation<any>();
  const { medications, toggleDoseTaken } = useMedStore();
  const { sharedAccountOwnerName } = useAuthStore();
  const ownerName = sharedAccountOwnerName || 'Shared';
  const ownerInitials = ownerName.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
  const totalDoses = medications.reduce((s, m) => s + m.totalDosesToday, 0);
  const takenDoses = medications.reduce((s, m) => s + m.dosesTakenToday.filter(Boolean).length, 0);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Account switcher bar */}
        <View style={s.switchBar}>
          <View>
            <Text style={[s.switchLabel, { color: colors.blueD }]}>Current Account</Text>
            <Text style={s.switchName}>{ownerName}'s Account</Text>
          </View>
          <TouchableOpacity style={s.switchBtn} onPress={() => navigation.navigate('AccountSwitcher')}>
            <Text style={s.switchBtnText}>Switch ⇄</Text>
          </TouchableOpacity>
        </View>

        <View style={s.header}>
          <Text style={s.logo}>Daily<Text style={{ color: colors.mint }}>Dose</Text>+</Text>
          <View style={[s.avatar, { backgroundColor: '#e0eeff' }]}><Text style={[s.avatarText, { color: colors.blueD }]}>{ownerInitials}</Text></View>
        </View>

        <Text style={s.greetSmall}>Managing account for</Text>
        <Text style={s.greetBig}>{ownerName}</Text>

        {/* Permission warning */}
        <View style={s.permWarn}>
          <Text style={s.permIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.permTitle}>View & log access only</Text>
            <Text style={s.permSub}>You can mark doses and view the schedule. Editing medications requires {ownerName}'s approval.</Text>
          </View>
        </View>

        {/* Progress card */}
        <View style={s.progressCard}>
          <Text style={s.cardLabel}>{ownerName}'s progress today</Text>
          <Text style={s.cardBig}>{takenDoses} <Text style={s.cardTotal}>/ {totalDoses}</Text></Text>
          <Text style={s.cardSub}>{totalDoses - takenDoses} more dose{totalDoses - takenDoses !== 1 ? 's' : ''} today</Text>
          <View style={s.pbar}><View style={[s.pfill, { width: `${totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0}%` as any }]} /></View>
        </View>

        <Text style={s.sectionHead}>{ownerName}'s doses today</Text>
        {medications.map((med) =>
          med.dosesTakenToday.map((taken, di) => (
            <TouchableOpacity
              key={`${med.id}-${di}`}
              style={[s.medRow, taken && s.medRowDone]}
              onPress={() => toggleDoseTaken(med.id, di)}
              activeOpacity={0.7}
            >
              <View style={[s.medIcon, { backgroundColor: med.color }]}>
                <MaterialCommunityIcons name={med.iconName as any} size={18} color={colors.mintD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.medName}>{med.name}</Text>
                <Text style={s.medTime}>{taken ? `${med.reminderTime} · Logged by you ✓` : `Next dose · ${med.reminderTime}`}</Text>
              </View>
              <View style={[s.checkCircle, taken && s.checkCircleDone]}>
                {taken && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  switchBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f5ff', borderWidth: 1.5, borderColor: '#c5d8f0', borderRadius: 12, padding: 10, marginBottom: 12 },
  switchLabel: { fontSize: fontSizes.xs - 1, fontFamily: fonts.bold, textTransform: 'uppercase', letterSpacing: 0.6 },
  switchName: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy, marginTop: 1 },
  switchBtn: { backgroundColor: colors.mintL, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  switchBtnText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logo: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSizes.xs, fontFamily: fonts.bold },
  greetSmall: { fontSize: fontSizes.sm, color: colors.muted, marginBottom: 2 },
  greetBig: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy, marginBottom: 12 },
  permWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fff8e8', borderWidth: 1.5, borderColor: '#f0d8a0', borderRadius: 12, padding: 10, marginBottom: 12 },
  permIcon: { fontSize: 16 },
  permTitle: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: '#7a5010' },
  permSub: { fontSize: fontSizes.xs - 1, color: '#a07030', lineHeight: 15, marginTop: 2 },
  progressCard: { backgroundColor: colors.mint, borderRadius: 18, padding: 18, marginBottom: 16 },
  cardLabel: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  cardBig: { fontSize: 32, fontFamily: fonts.bold, color: '#fff' },
  cardTotal: { fontSize: 16, fontFamily: fonts.regular, opacity: 0.8 },
  cardSub: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  pbar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 10 },
  pfill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  sectionHead: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: colors.border },
  medRowDone: { borderColor: colors.mintM, backgroundColor: '#f4fcf9' },
  medIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  medName: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  medTime: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkCircleDone: { backgroundColor: colors.mint, borderColor: colors.mint },
});
