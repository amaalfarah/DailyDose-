// screens/home/CalendarScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useMedStore } from '../../store/useMedStore';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "2:30 PM" → minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(' ');
  const [hourStr, minStr] = (parts[0] ?? '').split(':');
  const period = parts[1] ?? 'AM';
  let hour = parseInt(hourStr) || 0;
  const min = parseInt(minStr ?? '0') || 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + min;
}

export default function CalendarScreen() {
  const { medications, doseHistory } = useMedStore();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const isViewingCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(1);
  };

  const getDateKey = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDayKey = (day: number) =>
    DAY_KEYS[new Date(viewYear, viewMonth, day).getDay()];

  // Does any active med have this weekday in its schedule and date within range?
  const hasMedsOnDay = (day: number) => {
    const key = getDayKey(day);
    const cellDate = new Date(viewYear, viewMonth, day);
    cellDate.setHours(0, 0, 0, 0);
    return medications.some((m) => {
      if (!m.isActive || !(m.daysOfWeek ?? []).includes(key)) return false;
      const start = new Date(m.startDate);
      const end = m.endDate ? new Date(m.endDate) : null;
      return cellDate >= start && (!end || cellDate <= end);
    });
  };

  const getLogForDay = (day: number) => {
    const dayKey = getDayKey(day);
    const isToday = isViewingCurrentMonth && day === today.getDate();
    const cellDate = new Date(viewYear, viewMonth, day);
    cellDate.setHours(0, 0, 0, 0);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isFutureDay = cellDate > todayMidnight;

    const scheduledMeds = medications.filter(
      (m) => {
        if (!m.isActive || !(m.daysOfWeek ?? []).includes(dayKey)) return false;
        const start = new Date(m.startDate);
        const end = m.endDate ? new Date(m.endDate) : null;
        return cellDate >= start && (!end || cellDate <= end);
      }
    );

    if (scheduledMeds.length === 0) return [];

    if (isToday) {
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      return scheduledMeds.flatMap((m) =>
        m.dosesTakenToday.map((taken, i) => {
          const time = m.reminderTimes?.[i] ?? m.reminderTime;
          return {
            medId: m.id,
            medName: m.name,
            time,
            taken,
            upcoming: !taken && parseTimeToMinutes(time) > nowMinutes,
          };
        })
      );
    }

    if (isFutureDay) {
      return scheduledMeds.flatMap((m) => {
        const times = m.reminderTimes?.length
          ? m.reminderTimes
          : Array(m.totalDosesToday || 1).fill(m.reminderTime);
        return times.map((time: string) => ({
          medId: m.id,
          medName: m.name,
          time,
          taken: false,
          upcoming: true,
        }));
      });
    }

    // Past day — build from schedule, overlay history for taken status
    const historyEntries = doseHistory[getDateKey(day)] ?? [];
    const historyMap = new Map(historyEntries.map((e) => [`${e.medId}-${e.time}`, e.taken]));

    return scheduledMeds.flatMap((m) => {
      const times = m.reminderTimes?.length
        ? m.reminderTimes
        : Array(m.totalDosesToday || 1).fill(m.reminderTime);
      return times.map((time: string) => ({
        medId: m.id,
        medName: m.name,
        time,
        taken: historyMap.get(`${m.id}-${time}`) ?? false,
        upcoming: false,
      }));
    });
  };

  const byTime = (a: { time: string }, b: { time: string }) =>
    parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);

  const selectedLog = getLogForDay(selectedDay);
  const takenLog    = selectedLog.filter((e) => e.taken).sort(byTime);
  const notTakenLog = selectedLog.filter((e) => !e.taken && !e.upcoming).sort(byTime);
  const upcomingLog = selectedLog.filter((e) => e.upcoming).sort(byTime);

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
          <TouchableOpacity
            onPress={goToNextMonth}
            style={s.navBtn}
            activeOpacity={0.7}
            disabled={isViewingCurrentMonth}
          >
            <MaterialCommunityIcons name="chevron-right" size={22} color={isViewingCurrentMonth ? colors.border : colors.navy} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={s.dayHeaders}>
          {DAYS.map((d, i) => <Text key={i} style={s.dayHeader}>{d}</Text>)}
        </View>

        {/* Calendar grid */}
        <View style={s.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={s.gridRow}>
              {row.map((d, ci) => {
                const isToday = isViewingCurrentMonth && d === today.getDate();
                const isPast = d !== null && (
                  viewYear < today.getFullYear() ||
                  (viewYear === today.getFullYear() && viewMonth < today.getMonth()) ||
                  (isViewingCurrentMonth && d < today.getDate())
                );
                const isFuture = d !== null && !isToday && !isPast;
                const isSelected = d === selectedDay;
                const hasScheduled = d !== null && hasMedsOnDay(d);

                return (
                  <TouchableOpacity
                    key={ci}
                    disabled={!d}
                    onPress={() => d && setSelectedDay(d)}
                    style={[
                      s.cell,
                      isToday && s.cellToday,
                      isPast && hasScheduled && s.cellDone,
                      isSelected && s.cellSelectedBorder,
                    ]}
                    activeOpacity={0.7}
                  >
                    {d ? (
                      <>
                        <Text style={[
                          s.cellText,
                          (isToday || (isPast && hasScheduled)) && { color: '#fff' },
                          isFuture && s.cellTextFuture,
                        ]}>
                          {d}
                        </Text>
                        {hasScheduled && (
                          <View style={[
                            s.cellDot,
                            { backgroundColor: (isToday || (isPast && hasScheduled)) ? 'rgba(255,255,255,0.7)' : colors.mint },
                          ]} />
                        )}
                      </>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Day detail */}
        <Text style={s.sectionHead}>{selectedDateLabel}</Text>

        {selectedLog.length === 0 ? (
          hasMedsOnDay(selectedDay) ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>No doses recorded for this day</Text>
            </View>
          ) : null
        ) : (
          <>
            {takenLog.length > 0 && (
              <>
                <Text style={s.groupLabel}>Taken</Text>
                {takenLog.map((entry, i) => {
                  const cardKey = `taken-${entry.medId}-${entry.time}`;
                  const expanded = expandedCard === cardKey;
                  const med = medications.find((m) => m.id === entry.medId);
                  return (
                    <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => setExpandedCard(expanded ? null : cardKey)} style={[s.logRow, s.logRowTaken]}>
                      <View style={[s.dot, { backgroundColor: colors.mint, marginTop: 4 }]} />
                      <View style={{ flex: 1 }}>
                        <View style={s.cardHeader}>
                          <Text style={s.logTitle}>{entry.medName} · {entry.time}</Text>
                          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mint} />
                        </View>
                        <Text style={[s.logSub, { color: colors.mint }]}>Taken ✓</Text>
                        {expanded && med && (
                          <View style={s.cardDetail}>
                            <View style={s.detailRow}>
                              <Text style={s.detailLabel}>Dosage</Text>
                              <Text style={s.detailValue}>{med.dosage}</Text>
                            </View>
                            {med.coverName ? (
                              <View style={s.detailRow}>
                                <Text style={s.detailLabel}>Cover Name</Text>
                                <Text style={s.detailValue}>{med.coverName}</Text>
                              </View>
                            ) : null}
                            <View style={s.detailRow}>
                              <Text style={s.detailLabel}>Hide in notifications</Text>
                              <Text style={[s.detailValue, { color: med.privacyMode ? colors.mint : colors.muted }]}>{med.privacyMode ? 'On' : 'Off'}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {notTakenLog.length > 0 && (
              <>
                <Text style={[s.groupLabel, { color: colors.red }]}>Not Taken</Text>
                {notTakenLog.map((entry, i) => {
                  const cardKey = `nottaken-${entry.medId}-${entry.time}`;
                  const expanded = expandedCard === cardKey;
                  const med = medications.find((m) => m.id === entry.medId);
                  return (
                    <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => setExpandedCard(expanded ? null : cardKey)} style={[s.logRow, s.logRowNotTaken]}>
                      <View style={[s.dot, { backgroundColor: colors.red, marginTop: 4 }]} />
                      <View style={{ flex: 1 }}>
                        <View style={s.cardHeader}>
                          <Text style={s.logTitle}>{entry.medName} · {entry.time}</Text>
                          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.red} />
                        </View>
                        <Text style={[s.logSub, { color: colors.red }]}>Not Taken</Text>
                        {expanded && med && (
                          <View style={s.cardDetail}>
                            <View style={s.detailRow}>
                              <Text style={s.detailLabel}>Dosage</Text>
                              <Text style={s.detailValue}>{med.dosage}</Text>
                            </View>
                            {med.coverName ? (
                              <View style={s.detailRow}>
                                <Text style={s.detailLabel}>Cover Name</Text>
                                <Text style={s.detailValue}>{med.coverName}</Text>
                              </View>
                            ) : null}
                            <View style={s.detailRow}>
                              <Text style={s.detailLabel}>Hide in notifications</Text>
                              <Text style={[s.detailValue, { color: med.privacyMode ? colors.mint : colors.muted }]}>{med.privacyMode ? 'On' : 'Off'}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {upcomingLog.length > 0 && (
              <>
                <Text style={[s.groupLabel, { color: colors.muted }]}>Upcoming</Text>
                {upcomingLog.map((entry, i) => {
                  const cardKey = `upcoming-${entry.medId}-${entry.time}`;
                  const expanded = expandedCard === cardKey;
                  const med = medications.find((m) => m.id === entry.medId);
                  return (
                    <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => setExpandedCard(expanded ? null : cardKey)} style={[s.logRow, s.logRowUpcoming]}>
                      <View style={[s.dot, { backgroundColor: colors.muted, marginTop: 4 }]} />
                      <View style={{ flex: 1 }}>
                        <View style={s.cardHeader}>
                          <Text style={s.logTitle}>{entry.medName} · {entry.time}</Text>
                          <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
                        </View>
                        <Text style={[s.logSub, { color: colors.muted }]}>Scheduled</Text>
                        {expanded && med && (
                          <View style={s.cardDetail}>
                            <View style={s.detailRow}>
                              <Text style={s.detailLabel}>Dosage</Text>
                              <Text style={s.detailValue}>{med.dosage}</Text>
                            </View>
                            {med.coverName ? (
                              <View style={s.detailRow}>
                                <Text style={s.detailLabel}>Cover Name</Text>
                                <Text style={s.detailValue}>{med.coverName}</Text>
                              </View>
                            ) : null}
                            <View style={s.detailRow}>
                              <Text style={s.detailLabel}>Hide in notifications</Text>
                              <Text style={[s.detailValue, { color: med.privacyMode ? colors.mint : colors.muted }]}>{med.privacyMode ? 'On' : 'Off'}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
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
  title: { fontSize: fontSizes.xxl, fontFamily: fonts.bold, color: colors.navy, textAlign: 'center', marginBottom: 10 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14, gap: 12 },
  monthLabel: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy, minWidth: 140, textAlign: 'center' },
  navBtn: { padding: 4, borderRadius: 8 },
  dayHeaders: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayHeader: { fontSize: fontSizes.xs, color: colors.muted, fontFamily: fonts.bold, width: 36, textAlign: 'center' },
  grid: { marginBottom: 20 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  cell: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  cellToday: { backgroundColor: colors.navy },
  cellDone: { backgroundColor: colors.mint },
  cellSelectedBorder: { borderColor: colors.navy },
  cellText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: '#999' },
  cellTextFuture: { color: '#ccc' },
  cellDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  sectionHead: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  groupLabel: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  emptyCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  emptyText: { fontSize: fontSizes.sm, color: colors.muted, fontFamily: fonts.medium },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 10, marginBottom: 7, borderWidth: 1.5 },
  logRowTaken: { backgroundColor: colors.mintL, borderColor: colors.mintM },
  logRowNotTaken: { backgroundColor: colors.redL, borderColor: '#f0b0b0' },
  logRowUpcoming: { backgroundColor: colors.white, borderColor: colors.border },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logTitle: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy, flex: 1 },
  logSub: { fontSize: fontSizes.xs, marginTop: 1, fontFamily: fonts.medium },
  cardDetail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', gap: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: fontSizes.xs, color: colors.muted, fontFamily: fonts.medium },
  detailValue: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.navy },
});
