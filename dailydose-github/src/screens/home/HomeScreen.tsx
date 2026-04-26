// screens/home/HomeScreen.tsx
import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useMedStore } from '../../store/useMedStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import { useAuthStore } from '../../store/useAuthStore';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function toMinutes(t: string): number {
  const [time, period] = (t ?? '').split(' ');
  const [h, m] = time.split(':').map(Number);
  return ((h % 12) + (period === 'PM' ? 12 : 0)) * 60 + (m || 0);
}

export default function HomeScreen() {
  const { medications, toggleDoseTaken } = useMedStore();
  const { checkTrialExpiry } = useSettingsStore();
  const { isOnTrial, daysRemaining } = useTrialStatus();
  const { user, pendingName } = useAuthStore();
  const displayName = user?.name || pendingName || 'there';

  useEffect(() => {
    checkTrialExpiry();
  }, []);

  const totalDoses = medications.reduce((s, m) => s + m.totalDosesToday, 0);
  const takenDoses = medications.reduce(
    (s, m) => s + m.dosesTakenToday.filter(Boolean).length, 0
  );
  const progress = totalDoses > 0 ? takenDoses / totalDoses : 0;

  const upcomingDoses = medications
    .filter((m) => m.isActive)
    .flatMap((m) =>
      m.dosesTakenToday.map((taken, i) => ({
        med: m,
        taken,
        doseIndex: i,
        time: m.reminderTimes?.[i] ?? m.reminderTime,
      }))
    )
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
    .slice(0, 4);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Daily<Text style={{ color: colors.mint }}>Dose</Text>+</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>MS</Text>
          </View>
        </View>

        <Text style={styles.greetSmall}>Good morning,</Text>
        <Text style={styles.greetBig}>Hello {displayName}</Text>

        {/* Progress card */}
        <View style={styles.progressCard}>
          <Text style={styles.cardLabel}>Today's progress</Text>
          <Text style={styles.cardBig}>
            {takenDoses}{' '}
            <Text style={styles.cardTotal}>/ {totalDoses}</Text>
          </Text>
          <Text style={styles.cardSub}>
            {totalDoses - takenDoses} more dose{totalDoses - takenDoses !== 1 ? 's' : ''} today
          </Text>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>

          {/* Week streak */}
          <View style={styles.weekRow}>
            {WEEK_DAYS.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.weekDay,
                  i < 2 && styles.weekDone,
                  i === 2 && styles.weekToday,
                ]}
              >
                <Text style={styles.weekDayText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming doses */}
        {upcomingDoses.length > 0 ? (
          <>
            <Text style={styles.sectionHead}>Upcoming doses</Text>
            {upcomingDoses.map(({ med, taken, doseIndex, time }) => (
              <TouchableOpacity
                key={`${med.id}-${doseIndex}`}
                style={[styles.medRow, taken && styles.medRowDone]}
                onPress={() => toggleDoseTaken(med.id, doseIndex)}
                activeOpacity={0.7}
              >
                <View style={[styles.medIcon, { backgroundColor: med.color }]}>
                  <MaterialCommunityIcons
                    name={med.iconName as any}
                    size={18}
                    color={colors.mintD}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medTime}>
                    {med.dosage} · {time}{taken ? ' ✓' : ''}
                  </Text>
                  {med.coverName ? (
                    <Text style={styles.medCoverName}>{med.coverName.toLowerCase()}</Text>
                  ) : null}
                </View>
                <View style={[styles.checkCircle, taken && styles.checkCircleDone]}>
                  {taken && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="pill" size={32} color={colors.mintM} />
            <Text style={styles.emptyText}>No medications added yet</Text>
            <Text style={styles.emptySubText}>Add your first medication to get started</Text>
          </View>
        )}
        {/* Trial countdown */}
        {isOnTrial && daysRemaining !== null && (
          <View style={styles.trialBanner}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.mintD} />
            <Text style={styles.trialBannerText}>
              <Text style={styles.trialBannerDays}>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</Text>
              {' '}left in your free trial
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  logo: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy, letterSpacing: -0.4 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.mintL,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  greetSmall: { fontSize: fontSizes.sm, color: colors.muted, marginBottom: 2 },
  greetBig: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy, marginBottom: 14 },
  progressCard: {
    backgroundColor: colors.mint,
    borderRadius: 18, padding: 18, marginBottom: 18,
  },
  cardLabel: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  cardBig: { fontSize: 32, fontFamily: fonts.bold, color: '#fff', lineHeight: 36 },
  cardTotal: { fontSize: 16, fontFamily: fonts.regular, opacity: 0.8 },
  cardSub: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  progressBar: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3, marginTop: 12,
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  weekRow: { flexDirection: 'row', gap: 5, marginTop: 12 },
  weekDay: {
    flex: 1, height: 28, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  weekDone: { backgroundColor: 'rgba(255,255,255,0.25)' },
  weekToday: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  weekDayText: { fontSize: fontSizes.xs - 1, fontFamily: fonts.bold, color: '#fff' },
  sectionHead: {
    fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  medRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1.5, borderColor: colors.border,
  },
  medRowDone: { borderColor: colors.mintM, backgroundColor: '#f4fcf9' },
  medIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  medName: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  medTime: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  medCoverName: { fontSize: fontSizes.xs - 1, color: colors.mintD, marginTop: 1 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleDone: { backgroundColor: colors.mint, borderColor: colors.mint },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  emptySubText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.muted,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.mintL,
    borderWidth: 1.5,
    borderColor: colors.mintM,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  trialBannerText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.mintD,
  },
  trialBannerDays: {
    fontFamily: fonts.bold,
    color: colors.mintD,
  },
});
