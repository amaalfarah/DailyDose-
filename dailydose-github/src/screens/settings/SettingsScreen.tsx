// screens/settings/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, StyleSheet, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useSettingsStore, AppLanguage } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';

const LANGUAGES: { code: AppLanguage; name: string; native: string; flag: string }[] = [
  { code: 'en', name: 'English',  native: 'English',   flag: '🇺🇸' },
  { code: 'es', name: 'Spanish',  native: 'Español',   flag: '🇪🇸' },
  { code: 'fr', name: 'French',   native: 'Français',  flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic',   native: 'العربية',   flag: '🇸🇦' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const {
    language, setLanguage,
    privacyMode, setPrivacyMode,
    doseReminders, missedDoseAlerts, refillReminders, caregiverUpdates,
    toggleSetting,
  } = useSettingsStore();
  const { user, logout, savedCaregiverCode, setSavedCaregiverCode, setPendingInviteToken } = useAuthStore();
  const initials = (user?.name ?? '').split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
  const [codeExpanded, setCodeExpanded] = useState(false);
  const [caregiverCode, setCaregiverCode] = useState(savedCaregiverCode);
  const [codeError, setCodeError] = useState('');

  function handleLogout() {
    logout();
  }

  function handleApplyCode() {
    const trimmed = caregiverCode.trim();
    if (!trimmed) {
      setCodeError('Please enter a caregiver code.');
      return;
    }
    setCodeError('');
    setCodeExpanded(false);
    setSavedCaregiverCode(trimmed);
    setPendingInviteToken(trimmed);
    navigation.navigate('AccountSwitcher');
  }

  function handleLanguageChange(lang: AppLanguage) {
    if (lang === language) return;
    setLanguage(lang);
    if (lang === 'ar') {
      Alert.alert(
        'Language Changed',
        'Arabic requires restarting the app for full RTL support. Please restart DailyDose+ to apply changes.',
        [{ text: 'OK' }]
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Daily<Text style={{ color: colors.mint }}>Dose</Text>+</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile */}
        <Text style={styles.sectionHead}>Profile</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{user?.name ?? ''}</Text>
            <Text style={styles.rowSub}>{user?.email ?? ''}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionHead}>Notifications</Text>
        <ToggleRow
          label="Dose reminders"
          value={doseReminders}
          onToggle={() => toggleSetting('doseReminders')}
        />
        <ToggleRow
          label="Missed dose alerts"
          value={missedDoseAlerts}
          onToggle={() => toggleSetting('missedDoseAlerts')}
        />
        <ToggleRow
          label="Refill reminders"
          value={refillReminders}
          onToggle={() => toggleSetting('refillReminders')}
        />
        <ToggleRow
          label="Caregiver updates"
          value={caregiverUpdates}
          onToggle={() => toggleSetting('caregiverUpdates')}
        />

        {/* Privacy */}
        <Text style={styles.sectionHead}>Privacy</Text>
        <View style={[styles.row, { backgroundColor: '#fff4ff', borderColor: '#e8d0f0' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Hide medication names in notifications</Text>
            <Text style={styles.rowSub}>Always use cover name — or generic text if none set</Text>
          </View>
          <Switch
            value={privacyMode}
            onValueChange={setPrivacyMode}
            trackColor={{ false: colors.border, true: colors.mint }}
            thumbColor="#fff"
          />
        </View>

        {/* Caregiver */}
        <Text style={styles.sectionHead}>Caregiver</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Invite')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Add caregiver</Text>
            <Text style={styles.rowSub}>Let family help manage your medications</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        {/* Caregiver Code */}
        <TouchableOpacity
          style={[styles.row, codeExpanded && styles.rowExpanded]}
          onPress={() => { setCodeExpanded(!codeExpanded); setCodeError(''); }}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Enter caregiver code</Text>
            <Text style={styles.rowSub}>
              {savedCaregiverCode ? `Code saved: ${savedCaregiverCode}` : "Got a code? Link to someone's account"}
            </Text>
          </View>
          <Text style={styles.arrow}>{codeExpanded ? '⌄' : '›'}</Text>
        </TouchableOpacity>
        {codeExpanded && (
          <View style={styles.codePanel}>
            <TextInput
              style={[styles.codeInput, codeError ? styles.codeInputError : null]}
              placeholder="Paste or type code here"
              placeholderTextColor="#b0bec5"
              value={caregiverCode}
              onChangeText={(v) => { setCaregiverCode(v); setCodeError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {codeError ? <Text style={styles.codeError}>{codeError}</Text> : null}
            <TouchableOpacity style={styles.codeApplyBtn} onPress={handleApplyCode}>
              <Text style={styles.codeApplyText}>Apply Code</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('AccountSwitcher')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Manage accounts</Text>
            <Text style={styles.rowSub}>Switch between personal &amp; shared accounts</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Subscription */}
        <Text style={styles.sectionHead}>Subscription</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Subscription')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Manage Subscription</Text>
            <Text style={styles.rowSub}>View plan, billing, and renewal details</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Language */}
        <Text style={styles.sectionHead}>Language</Text>
        <View style={styles.langCard}>
          <View style={styles.langCardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>App Language</Text>
              <Text style={styles.rowSub}>All notifications and UI will use this language</Text>
            </View>
            <View style={styles.activeLangBadge}>
              <Text style={styles.activeLangText}>
                {LANGUAGES.find((l) => l.code === language)?.flag}{' '}
                {LANGUAGES.find((l) => l.code === language)?.native}
              </Text>
            </View>
          </View>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langOption, language === lang.code && styles.langOptionSelected]}
              onPress={() => handleLanguageChange(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.langName}>{lang.name}</Text>
                <Text style={styles.langNative}>{lang.native}</Text>
              </View>
              <View style={[styles.checkCircle, language === lang.code && styles.checkCircleOn]}>
                {language === lang.code && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>DailyDose+ · Version 1.0.0</Text>
          <Text style={styles.versionSub}>© 2026 DailyDose+. All rights reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.mint }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  logo: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy },
  headerTitle: { fontSize: fontSizes.md, fontFamily: fonts.bold, color: colors.navy },
  sectionHead: {
    fontSize: fontSizes.xs - 1, fontFamily: fonts.bold, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 8, marginBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 12, padding: 12,
    marginBottom: 7, borderWidth: 1.5, borderColor: colors.border,
  },
  rowLabel: { fontSize: fontSizes.base, fontFamily: fonts.medium, color: colors.navy },
  rowSub: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  arrow: { fontSize: 20, color: colors.muted },
  rowExpanded: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0, marginBottom: 0 },
  codePanel: {
    backgroundColor: colors.white, borderWidth: 1.5, borderTopWidth: 0,
    borderColor: colors.border, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    padding: 12, marginBottom: 7,
  },
  codeInput: {
    backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy, marginBottom: 4,
  },
  codeInputError: { borderColor: colors.rose },
  codeError: { fontSize: fontSizes.xs, color: colors.rose, marginBottom: 8, marginLeft: 2 },
  codeApplyBtn: {
    backgroundColor: colors.mint, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', marginTop: 4,
  },
  codeApplyText: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: '#fff' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.mintL,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  langCard: {
    backgroundColor: colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden', marginBottom: 16,
  },
  langCardHead: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  activeLangBadge: {
    backgroundColor: colors.mintL, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  activeLangText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  langOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  langOptionSelected: { backgroundColor: colors.mintL },
  langFlag: { fontSize: 22 },
  langName: { fontSize: fontSizes.md, fontFamily: fonts.bold, color: colors.navy },
  langNative: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleOn: { backgroundColor: colors.mint, borderColor: colors.mint },
  logoutBtn: {
    backgroundColor: colors.roseL,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.rose,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.rose,
  },
  versionRow: { alignItems: 'center', paddingVertical: 28, gap: 4 },
  versionText: { fontSize: fontSizes.xs, fontFamily: fonts.medium, color: colors.muted },
  versionSub: { fontSize: fontSizes.xs - 1, color: '#b0bec5' },
});
