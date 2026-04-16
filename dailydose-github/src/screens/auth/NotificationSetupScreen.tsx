// screens/auth/NotificationSetupScreen.tsx
import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function NotificationSetupScreen() {
  const navigation = useNavigation<any>();
  const { doseReminders, missedDoseAlerts, refillReminders, caregiverUpdates, toggleSetting } = useSettingsStore();
  const { login } = useAuthStore();

  function handleContinue() {
    // Create the user and log them in
    login({
      id: Date.now().toString(),
      name: 'Maria Santos',
      email: 'maria@email.com',
      type: 'primary',
    });
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <View style={s.backArr} /><Text style={s.backLabel}>Notification settings</Text>
        </TouchableOpacity>
        <View style={s.stepPill}><Text style={s.stepText}>Step 3 of 4 — Reminders</Text></View>
        <Text style={s.note}>Set up reminders so you never forget a dose.</Text>

        <ToggleRow label="Dose reminders" sub="Push notifications before each dose" value={doseReminders} onToggle={() => toggleSetting('doseReminders')} />
        <ToggleRow label="Missed dose alerts" sub="Alert if dose not logged in 30 min" value={missedDoseAlerts} onToggle={() => toggleSetting('missedDoseAlerts')} />
        <ToggleRow label="Refill reminders" sub="Alert when supply is running low" value={refillReminders} onToggle={() => toggleSetting('refillReminders')} />
        <ToggleRow label="Caregiver updates" sub="Notify when another caregiver logs a dose" value={caregiverUpdates} onToggle={() => toggleSetting('caregiverUpdates')} />

        <View style={{ height: 12 }} />
        <TouchableOpacity style={s.btnPrimary} onPress={handleContinue}>
          <Text style={s.btnText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({ label, sub, value, onToggle }: any) {
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
  stepPill: { alignSelf: 'flex-start', backgroundColor: colors.mintL, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  stepText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  note: { fontSize: fontSizes.xs, color: colors.muted, lineHeight: 16, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: colors.border },
  rowLabel: { fontSize: fontSizes.base, fontFamily: fonts.medium, color: colors.navy },
  rowSub: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  btnPrimary: { backgroundColor: colors.mint, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
});
