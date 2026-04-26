// screens/home/CalendarScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useMedStore } from '../../store/useMedStore';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const { medications, doseHistory } = useMedStore();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const isViewingCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const getDateKey = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getLogForDay = (day: number) => {
    if (isViewingCurrentMonth && day === today.getDate()) {
      return medications.flatMap((m) =>
        m.dosesTakenToday.map((taken, i) => ({
          medId: m.id,
          medName: m.name,
          time: m.reminderTimes?.[i] ?? m.reminderTime,
          taken,
        }))
      );
    }
    return doseHistory[getDateKey(day)] ?? [];
  };

  const selectedLog = getLogForDay(selectedDay);
  const takenLog = selectedLog.filter((e) => e.taken);
  const notTakenLog = selectedLog.filter((e) => !e.taken);

  const selectedDateLabel = new Date(viewYear, viewMonth, selectedDay)
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.logo}>Daily<Text style={{ color: colors.mint }}>Dose</Text>+</Text>
        </View>
        <Text style={s.title}>Calendar</Text>

        {/* Month / Year navigator */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={s.navBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.navy} />
          </TouchableOpacity>
          <Text style={s.monthLabel}>{monthLabel} {viewYear}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={s.navBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.navy} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={s.dayHeaders}>
          {DAYS.map((d, i) => <Text key={i} style={s.dayHeader}>{d}</Text>)}
        </View>

        {/* Calendar grid */}
        <View style={s.grid}>
          {cells.map((d, i) => {
            const isToday = isViewingCurrentMonth && d === today.getDate();
            const isPast = d !== null && (
              viewYear < today.getFullYear() ||
              (viewYear === today.getFullYear() && viewMonth < today.getMonth()) ||
              (isViewingCurrentMonth && d < today.getDate())
            );
            const isFuture = d !== null && !isToday && !isPast;
            const isSelected = d === selectedDay;

            return (
              <TouchableOpacity
                key={i}
                disabled={!d || isFuture}
                onPress={() => d && setSelectedDay(d)}
                style={[
                  s.cell,
                  isToday && s.cellToday,
                  isPast && s.cellDone,
                  isSelected && s.cellSelectedBorder,
                ]}
                activeOpacity={0.7}
              >
                {d ? (
                  <Text style={[
                    s.cellText,
                    (isToday || isPast) && { color: '#fff' },
                    isFuture && s.cellTextFuture,
                  ]}>
                    {d}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Day detail */}
        <Text style={s.sectionHead}>{selectedDateLabel}</Text>

        {selectedLog.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No doses recorded for this day</Text>
          </View>
        ) : (
          <>
            {takenLog.length > 0 && (
              <>
                <Text style={s.groupLabel}>Taken</Text>
                {takenLog.map((entry, i) => (
                  <View key={i} style={[s.logRow, s.logRowTaken]}>
                    <View style={[s.dot, { backgroundColor: colors.mint }]} />
                    <View>
                      <Text style={s.logTitle}>{entry.medName} · {entry.time}</Text>
                      <Text style={[s.logSub, { color: colors.mint }]}>Taken ✓</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {notTakenLog.length > 0 && (
              <>
                <Text style={[s.groupLabel, { color: colors.red }]}>Not Taken</Text>
                {notTakenLog.map((entry, i) => (
                  <View key={i} style={[s.logRow, s.logRowNotTaken]}>
                    <View style={[s.dot, { backgroundColor: colors.red }]} />
                    <View>
                      <Text style={s.logTitle}>{entry.medName} · {entry.time}</Text>
                      <Text style={[s.logSub, { color: colors.red }]}>Not Taken</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy },
  title: { fontSize: fontSizes.md, fontFamily: fonts.bold, color: colors.navy, textAlign: 'center', marginBottom: 10 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14, gap: 12 },
  monthLabel: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy, minWidth: 140, textAlign: 'center' },
  navBtn: { padding: 4, borderRadius: 8 },
  dayHeaders: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayHeader: { fontSize: fontSizes.xs, color: colors.muted, fontFamily: fonts.bold, width: 36, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 20 },
  cell: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  cellToday: { backgroundColor: colors.navy },
  cellDone: { backgroundColor: colors.mint },
  cellSelectedBorder: { borderColor: colors.navy },
  cellText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: '#999' },
  cellTextFuture: { color: '#ccc' },
  sectionHead: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  groupLabel: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  emptyCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  emptyText: { fontSize: fontSizes.sm, color: colors.muted, fontFamily: fonts.medium },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 10, marginBottom: 7, borderWidth: 1.5 },
  logRowTaken: { backgroundColor: colors.mintL, borderColor: colors.mintM },
  logRowNotTaken: { backgroundColor: colors.redL, borderColor: '#f0b0b0' },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 3 },
  logTitle: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  logSub: { fontSize: fontSizes.xs, marginTop: 1, fontFamily: fonts.medium },
});
