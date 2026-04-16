// screens/home/CalendarScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useMedStore } from '../../store/useMedStore';

const DAYS = ['S','M','T','W','T','F','S'];

export default function CalendarScreen() {
  const { medications } = useMedStore();
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Build a simple 5-week grid
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.logo}>Daily<Text style={{ color: colors.mint }}>Dose</Text>+</Text>
          <Text style={s.title}>Calendar</Text>
        </View>
        <Text style={s.month}>{month}</Text>

        {/* Day headers */}
        <View style={s.dayHeaders}>
          {DAYS.map((d, i) => <Text key={i} style={s.dayHeader}>{d}</Text>)}
        </View>

        {/* Calendar grid */}
        <View style={s.grid}>
          {cells.map((d, i) => (
            <View key={i} style={[
              s.cell,
              d === today.getDate() && s.cellToday,
              d && d < today.getDate() && s.cellDone,
            ]}>
              {d ? <Text style={[s.cellText, d === today.getDate() && { color: '#fff' }, d && d < today.getDate() && { color: '#fff' }]}>{d}</Text> : null}
            </View>
          ))}
        </View>

        {/* Today's log */}
        <Text style={s.sectionHead}>Today — {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
        {medications.flatMap((m, mi) =>
          m.dosesTakenToday.map((taken, di) => (
            <View key={`${mi}-${di}`} style={s.logRow}>
              <View style={[s.dot, { backgroundColor: taken ? colors.mint : colors.border }]} />
              <View>
                <Text style={s.logTitle}>{m.name} · {m.reminderTime}</Text>
                <Text style={s.logSub}>{taken ? 'Taken ✓' : 'Upcoming'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logo: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy },
  title: { fontSize: fontSizes.md, fontFamily: fonts.bold, color: colors.navy },
  month: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy, marginBottom: 8 },
  dayHeaders: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayHeader: { fontSize: fontSizes.xs, color: colors.muted, fontFamily: fonts.bold, width: 32, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 16 },
  cell: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  cellToday: { backgroundColor: colors.navy },
  cellDone: { backgroundColor: colors.mint },
  cellText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: '#ccc' },
  sectionHead: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.white, borderRadius: 12, padding: 10, marginBottom: 7, borderWidth: 1.5, borderColor: colors.border },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 3 },
  logTitle: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  logSub: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
});
