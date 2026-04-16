// screens/auth/AddMedicationScreen.tsx
// TODO: Implement full medication form with:
// - Medication name (required)
// - Cover name (optional, with privacy helper text)
// - Dosage field
// - Frequency chips (Daily, Twice daily, 3x daily, As needed)
// - Reminder time picker
// - Color swatch picker (6 colors)
// - Icon chooser (two tabs: Medication icons, Neutral icons)
// - Privacy toggle (hide name in notifications)
// Reference: s1-2 in DailyDose_Code.html

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useMedStore } from '../../store/useMedStore';

const COLORS = ['#e3f7f0', '#fdedf2', '#eaf2fb', '#fef3e7', '#f0eafb', '#fafaea'];
const MED_ICONS = [
  { name: 'pill', label: 'Pill' },
  { name: 'needle', label: 'Syringe' },
  { name: 'stethoscope', label: 'Stethoscope' },
  { name: 'bottle-tonic', label: 'Bottle' },
  { name: 'flask', label: 'Flask' },
  { name: 'heart-pulse', label: 'Heartbeat' },
];
const NEUTRAL_ICONS = [
  { name: 'star', label: 'Star' },
  { name: 'heart', label: 'Heart' },
  { name: 'white-balance-sunny', label: 'Sun' },
  { name: 'leaf', label: 'Leaf' },
  { name: 'water', label: 'Drop' },
  { name: 'snowflake', label: 'Snowflake' },
];
const FREQUENCIES = ['daily', 'twice-daily', '3x-daily', 'as-needed'] as const;
const FREQ_LABELS: Record<string, string> = {
  'daily': 'Daily',
  'twice-daily': 'Twice daily',
  '3x-daily': '3× daily',
  'as-needed': 'As needed',
};

export default function AddMedicationScreen() {
  const navigation = useNavigation<any>();
  const { addMedication } = useMedStore();

  const [name, setName]           = useState('');
  const [coverName, setCoverName] = useState('');
  const [dosage, setDosage]       = useState('');
  const [frequency, setFreq]      = useState<typeof FREQUENCIES[number]>('daily');
  const [reminderTime, setTime]   = useState('08:00');
  const [selectedColor, setColor] = useState(COLORS[0]);
  const [selectedIcon, setIcon]   = useState('pill');
  const [iconTab, setIconTab]     = useState<'med' | 'neutral'>('med');
  const [privacyMode, setPrivacy] = useState(false);

  function handleSave() {
    if (!name.trim()) return;
    addMedication({
      name: name.trim(),
      coverName: coverName.trim() || undefined,
      dosage: dosage.trim() || '—',
      frequency,
      reminderTime,
      color: selectedColor,
      iconName: selectedIcon,
      iconCategory: iconTab,
      isPRN: frequency === 'as-needed',
      isActive: true,
      dosesTakenToday: frequency === 'twice-daily' ? [false, false] : frequency === '3x-daily' ? [false, false, false] : [false],
      totalDosesToday: frequency === 'twice-daily' ? 2 : frequency === '3x-daily' ? 3 : 1,
    });
    navigation.navigate('NotificationSetup');
  }

  const icons = iconTab === 'med' ? MED_ICONS : NEUTRAL_ICONS;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <View style={s.backArr} /><Text style={s.backLabel}>Add medication</Text>
        </TouchableOpacity>
        <View style={s.stepPill}><Text style={s.stepText}>Step 2 of 4 — Medications</Text></View>
        <Text style={s.note}>Add Luis's daily medications. You can always add or edit later.</Text>

        <Text style={s.lbl}>Medication name <Text style={{ color: colors.rose }}>Required</Text></Text>
        <TextInput style={s.inp} placeholder="e.g. Amoxicillin 250mg" placeholderTextColor="#b0bec5" value={name} onChangeText={setName} />

        <Text style={s.lbl}>Dosage</Text>
        <TextInput style={s.inp} placeholder="e.g. 250mg / 5mL" placeholderTextColor="#b0bec5" value={dosage} onChangeText={setDosage} />

        {/* Cover Name */}
        <View style={s.coverSection}>
          <View style={s.coverHead}>
            <MaterialCommunityIcons name="eye-off" size={14} color={colors.mintD} />
            <Text style={s.coverTitle}>Cover Name</Text>
            <View style={s.optionalBadge}><Text style={s.optionalText}>Optional</Text></View>
          </View>
          <Text style={s.coverHelper}>Use a private nickname to hide the real name in notifications.</Text>
          <TextInput style={s.coverInp} placeholder='e.g. "Morning Vitamin"' placeholderTextColor="#b8cfc8" value={coverName} onChangeText={setCoverName} />
        </View>

        {/* Privacy toggle */}
        <View style={s.privacyRow}>
          <MaterialCommunityIcons name="lock" size={16} color="#7a50a0" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.privacyLabel}>Hide medication names in notifications</Text>
            <Text style={s.privacySub}>Always use cover name or generic text</Text>
          </View>
          <Switch value={privacyMode} onValueChange={setPrivacy} trackColor={{ false: colors.border, true: colors.mint }} thumbColor="#fff" />
        </View>

        <Text style={s.lbl}>Frequency</Text>
        <View style={s.chips}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity key={f} style={[s.chip, frequency === f && s.chipOn]} onPress={() => setFreq(f)}>
              <Text style={[s.chipText, frequency === f && s.chipTextOn]}>{FREQ_LABELS[f]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.lbl}>Reminder time</Text>
        <TextInput style={s.inp} placeholder="08:00 AM" placeholderTextColor="#b0bec5" value={reminderTime} onChangeText={setTime} />

        {/* Preview */}
        <View style={s.preview}>
          <View style={[s.previewIcon, { backgroundColor: selectedColor }]}>
            <MaterialCommunityIcons name={selectedIcon as any} size={18} color={colors.mintD} />
          </View>
          <View>
            <Text style={s.previewLabel}>Reminder preview</Text>
            <Text style={s.previewName}>{(privacyMode && coverName) ? coverName : name || 'Your medication'}</Text>
            {coverName && !privacyMode && <Text style={s.previewCover}>Cover: {coverName}</Text>}
          </View>
        </View>

        {/* Color picker */}
        <Text style={s.lbl}>Color</Text>
        <View style={s.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity key={c} style={[s.colorSwatch, { backgroundColor: c }, selectedColor === c && s.colorSwatchOn]} onPress={() => setColor(c)} />
          ))}
        </View>

        {/* Icon chooser */}
        <View style={s.iconChooser}>
          <View style={s.iconChooserHead}>
            <Text style={s.iconChooserTitle}>Choose an Icon</Text>
            <View style={s.optionalBadge}><Text style={s.optionalText}>Optional</Text></View>
          </View>
          <View style={s.iconTabs}>
            <TouchableOpacity style={[s.iconTab, iconTab === 'med' && s.iconTabOn]} onPress={() => setIconTab('med')}>
              <MaterialCommunityIcons name="pill" size={16} color={iconTab === 'med' ? colors.mint : colors.muted} />
              <Text style={[s.iconTabText, iconTab === 'med' && s.iconTabTextOn]}>Medication</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.iconTab, iconTab === 'neutral' && s.iconTabOn]} onPress={() => setIconTab('neutral')}>
              <MaterialCommunityIcons name="leaf" size={16} color={iconTab === 'neutral' ? '#9b59b6' : colors.muted} />
              <Text style={[s.iconTabText, iconTab === 'neutral' && { color: '#6a2fa0' }]}>Neutral (Privacy)</Text>
            </TouchableOpacity>
          </View>
          <View style={s.iconGrid}>
            {icons.map((ic) => (
              <TouchableOpacity
                key={ic.name}
                style={[s.iconOpt, selectedIcon === ic.name && (iconTab === 'neutral' ? s.iconOptNeutralOn : s.iconOptOn)]}
                onPress={() => setIcon(ic.name)}
              >
                <MaterialCommunityIcons name={ic.name as any} size={20} color={selectedIcon === ic.name ? (iconTab === 'neutral' ? '#6a2fa0' : colors.mintD) : colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
          {iconTab === 'neutral' && <Text style={s.iconHelper}>Choose a neutral icon to keep your medication private in reminders.</Text>}
        </View>

        <TouchableOpacity style={s.btnPrimary} onPress={handleSave}>
          <Text style={s.btnText}>Next →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={() => navigation.navigate('NotificationSetup')}>
          <Text style={s.btnSecondaryText}>Skip for now</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
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
  lbl: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  inp: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy, marginBottom: 12 },
  coverSection: { backgroundColor: '#f0faf5', borderWidth: 1.5, borderColor: '#c8e8d8', borderRadius: 14, padding: 12, marginBottom: 10 },
  coverHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  coverTitle: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.mintD, flex: 1 },
  coverHelper: { fontSize: fontSizes.xs, color: colors.muted, lineHeight: 15, marginBottom: 8 },
  coverInp: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: '#c8e8d8', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy },
  optionalBadge: { backgroundColor: colors.mint, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  optionalText: { fontSize: fontSizes.xs - 1, fontFamily: fonts.bold, color: '#fff' },
  privacyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff4ff', borderWidth: 1.5, borderColor: '#e8d0f0', borderRadius: 12, padding: 12, marginBottom: 12 },
  privacyLabel: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: '#4a2060' },
  privacySub: { fontSize: fontSizes.xs, color: '#7a50a0', marginTop: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border },
  chipOn: { backgroundColor: colors.mintL, borderColor: colors.mintM },
  chipText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted },
  chipTextOn: { color: colors.mintD },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 14 },
  previewIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  previewLabel: { fontSize: fontSizes.xs, color: colors.muted },
  previewName: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  previewCover: { fontSize: fontSizes.xs, color: colors.mintD, marginTop: 2 },
  colorRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: 'transparent' },
  colorSwatchOn: { borderColor: colors.navy },
  iconChooser: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden', marginBottom: 14 },
  iconChooserHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconChooserTitle: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  iconTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  iconTab: { flex: 1, flexDirection: 'column', alignItems: 'center', paddingVertical: 10, gap: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  iconTabOn: { borderBottomColor: colors.mint },
  iconTabText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted },
  iconTabTextOn: { color: colors.mintD },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 8 },
  iconOpt: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center' },
  iconOptOn: { borderColor: colors.mint, backgroundColor: colors.mintL },
  iconOptNeutralOn: { borderColor: '#9b59b6', backgroundColor: '#f5eeff' },
  iconHelper: { fontSize: fontSizes.xs, color: '#7a50a0', padding: 10, paddingTop: 0, lineHeight: 16 },
  btnPrimary: { backgroundColor: colors.mint, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
  btnSecondary: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center' },
  btnSecondaryText: { color: colors.muted, fontFamily: fonts.medium, fontSize: fontSizes.base },
});
