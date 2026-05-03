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

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useMedStore } from '../../store/useMedStore';
import { useAuthStore } from '../../store/useAuthStore';
import MedicationSearch from '../../components/MedicationSearch';
import DrugInteractionModal from '../../components/DrugInteractionModal';
import {
  MedicationSearchResult,
  checkDrugInteractions,
  generateDrugsComLink,
  DrugInteraction,
} from '../../services/medicationApi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const ALL_DAYS = [...DAYS];

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

function parseDosage(dosage: string): { amount: string; unit: 'mg' | 'mL' } {
  const match = dosage.match(/^(\d+)(mg|mL)$/);
  if (match) return { amount: match[1], unit: match[2] as 'mg' | 'mL' };
  return { amount: dosage.replace(/[^\d]/g, ''), unit: 'mg' };
}

function parseReminderTime(t: string): { hour: string; period: 'AM' | 'PM' } {
  const parts = t.split(' ');
  return { hour: parts[0] || '', period: (parts[1] as 'AM' | 'PM') || 'AM' };
}

export default function AddMedicationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const fromTab = route.params?.fromTab === true;
  const medId = route.params?.medId as string | undefined;
  const { addMedication, updateMedication, medications } = useMedStore();
  const { pendingName } = useAuthStore();
  const displayName = pendingName || 'your';

  const existingMed = medId ? medications.find((m) => m.id === medId) : undefined;
  const isEditing = !!existingMed;

  const initDosage = existingMed ? parseDosage(existingMed.dosage) : { amount: '', unit: 'mg' as const };
  const initTimes = existingMed?.reminderTimes?.map(parseReminderTime) ?? [{ hour: '', period: 'AM' as const }];

  const [name, setName]           = useState(existingMed?.name ?? '');
  const [standardizedName, setStandardizedName] = useState(existingMed?.standardizedName ?? '');
  const [rxcui, setRxcui] = useState(existingMed?.rxcui ?? '');
  const [selectedMedication, setSelectedMedication] = useState<MedicationSearchResult | null>(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [pendingInteraction, setPendingInteraction] = useState<DrugInteraction | null>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [drugsComLink, setDrugsComLink] = useState<string | null>(null);
  const [coverName, setCoverName] = useState(existingMed?.coverName ?? '');
  const [dosageAmount, setDosageAmount] = useState(initDosage.amount);
  const [dosageUnit, setDosageUnit]     = useState<'mg' | 'mL'>(initDosage.unit);
  const [unitDropOpen, setUnitDropOpen] = useState(false);
  const [frequency, setFreq]            = useState<typeof FREQUENCIES[number]>(existingMed?.frequency ?? 'daily');
  const [reminderHours, setHours]       = useState<string[]>(initTimes.map((t) => t.hour));
  const [reminderPeriods, setPeriods]   = useState<('AM' | 'PM')[]>(initTimes.map((t) => t.period));
  const [periodDropOpen, setPeriodOpen] = useState<number | null>(null);
  const [selectedColor, setColor] = useState(existingMed?.color ?? COLORS[0]);
  const [selectedIcon, setIcon]   = useState(existingMed?.iconName ?? 'pill');
  const [iconTab, setIconTab]     = useState<'med' | 'neutral'>(existingMed?.iconCategory ?? 'med');
  const [privacyMode, setPrivacy] = useState(existingMed?.privacyMode ?? false);

  const [daysOfWeek, setDaysOfWeek]   = useState<string[]>(existingMed?.daysOfWeek ?? []);
  const [refillDate, setRefillDate]   = useState(existingMed?.refillDate ?? '');
  const [refillDateError, setRefillDateError] = useState('');
  const [startDateText, setStartDateText] = useState(() => {
    if (existingMed?.startDate) {
      const [y, m, d] = existingMed.startDate.split('-');
      return `${m}/${d}/${y}`;
    }
    const t = new Date();
    return `${String(t.getMonth() + 1).padStart(2, '0')}/${String(t.getDate()).padStart(2, '0')}/${t.getFullYear()}`;
  });
  const [endDateText, setEndDateText] = useState(() => {
    if (existingMed?.endDate) {
      const [y, m, d] = existingMed.endDate.split('-');
      return `${m}/${d}/${y}`;
    }
    return '';
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [nameError, setNameError]         = useState(false);
  const [dosageError, setDosageError]     = useState(false);
  const [coverNameError, setCoverNameError] = useState(false);

  // Auto-close when user switches to a different tab while this form is open
  useEffect(() => {
    if (!fromTab) return;
    const unsubscribe = navigation.addListener('blur', () => {
      const parentState = navigation.getParent()?.getState();
      const activeTab = parentState?.routes[parentState.index ?? 0]?.name;
      if (activeTab !== 'Meds') {
        navigation.goBack();
      }
    });
    return unsubscribe;
  }, [navigation, fromTab]);
  const [daysError, setDaysError]     = useState(false);
  const [timeErrors, setTimeErrors]   = useState<boolean[]>(initTimes.map(() => false));

  function formatTimeInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';
    if (digits.length === 1) return digits;
    const first = parseInt(digits[0]);
    if (first >= 2) return `${digits[0]}:${digits.slice(1, 3)}`;
    if (first === 0) return `${digits[0]}:${digits.slice(1, 3)}`;
    // first digit is 1
    const second = parseInt(digits[1]);
    if (second <= 2) {
      if (digits.length === 2) return digits; // "10", "11", "12" — wait for minutes
      return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    }
    return `${digits[0]}:${digits.slice(1, 3)}`; // "1:3x"
  }

  function formatDateInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  function parseMMDDYYYY(text: string): Date | null {
    const parts = text.split('/');
    if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) return null;
    const d = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
    return isNaN(d.getTime()) ? null : d;
  }

  function dateToMMDDYYYY(date: Date): string {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  }

  function mmddyyyyToISO(text: string): string {
    const [m, d, y] = text.split('/');
    return `${y}-${m}-${d}`;
  }

  function clampTime(val: string): string {
    if (!val) return '';
    const parts = val.includes(':') ? val.split(':') : [val, '0'];
    let h = parseInt(parts[0]) || 1;
    let m = parseInt(parts[1] || '0') || 0;
    h = Math.min(Math.max(h, 1), 12);
    m = Math.min(Math.max(m, 0), 59);
    return `${h}:${String(m).padStart(2, '0')}`;
  }

  function reminderCount(f: typeof FREQUENCIES[number]) {
    return f === 'twice-daily' ? 2 : f === '3x-daily' ? 3 : 1;
  }

  function handleFreqChange(f: typeof FREQUENCIES[number]) {
    const count = reminderCount(f);
    setFreq(f);
    setHours(prev => {
      const next = [...prev];
      while (next.length < count) next.push('');
      return next.slice(0, count);
    });
    setPeriods(prev => {
      const next = [...prev];
      while (next.length < count) next.push('AM' as const);
      return next.slice(0, count);
    });
    setTimeErrors(prev => {
      const next = [...prev];
      while (next.length < count) next.push(false);
      return next.slice(0, count);
    });
  }

  function addReminderSlot() {
    setHours(prev => [...prev, '']);
    setPeriods(prev => [...prev, 'AM' as const]);
    setTimeErrors(prev => [...prev, false]);
  }

  function removeReminderSlot(index: number) {
    setHours(prev => prev.filter((_, i) => i !== index));
    setPeriods(prev => prev.filter((_, i) => i !== index));
    setTimeErrors(prev => prev.filter((_, i) => i !== index));
  }

  function validateRefillDate(value: string): string {
    if (!value.trim()) return '';
    const parts = value.split('/');
    if (
      parts.length !== 3 ||
      parts[0]?.length !== 2 ||
      parts[1]?.length !== 2 ||
      parts[2]?.length !== 4
    ) return 'Enter a complete date in MM/DD/YYYY format.';
    const mm = parseInt(parts[0], 10);
    const dd = parseInt(parts[1], 10);
    const yyyy = parseInt(parts[2], 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(mm) || mm < 1 || mm > 12) return 'Month must be between 01 and 12.';
    if (isNaN(dd) || dd < 1 || dd > 31) return 'Day must be between 01 and 31.';
    if (isNaN(yyyy) || yyyy < currentYear) return 'Year must be this year or later.';
    if (yyyy > currentYear + 10) return 'Refill date can be at most 10 years in the future.';
    const d = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
    if (isNaN(d.getTime())) return 'Enter a valid date in MM/DD/YYYY format.';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d <= today) return 'Refill date must be in the future.';
    return '';
  }

  /**
   * Handle medication selection from autocomplete
   * Checks for drug interactions with existing medications
   */
  const handleMedicationSelect = async (med: MedicationSearchResult | null) => {
    if (!med) {
      setName('');
      setStandardizedName('');
      setRxcui('');
      setSelectedMedication(null);
      setDrugsComLink(null);
      return;
    }

    setName(med.displayName);
    setStandardizedName(med.standardizedName);
    setRxcui(med.rxcui);
    setSelectedMedication(med);
    setDrugsComLink(generateDrugsComLink(med.displayName));

    // Check for interactions with existing medications
    if (med.rxcui && !isEditing) {
      setIsCheckingInteractions(true);
      try {
        for (const existingMed of medications) {
          if (existingMed.rxcui) {
            const interaction = await checkDrugInteractions(med.rxcui, existingMed.rxcui);
            if (interaction) {
              setPendingInteraction(interaction);
              setShowInteractionModal(true);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error checking interactions:', error);
      } finally {
        setIsCheckingInteractions(false);
      }
    }
  };

  /**
   * Handle manual medication entry (when API search fails)
   */
  const handleManualMedicationEntry = (manualName: string) => {
    setName(manualName);
    setStandardizedName(manualName.toLowerCase());
    setRxcui('');
    setSelectedMedication(null);
    setDrugsComLink(generateDrugsComLink(manualName));
  };

  /**
   * Open Drugs.com details in external browser
   */
  const handleViewDetails = async () => {
    if (drugsComLink) {
      try {
        await Linking.openURL(drugsComLink);
      } catch (error) {
        console.error('Failed to open link:', error);
      }
    }
  };

  function handleSave() {
    const nameInvalid      = !name.trim();
    const dosageInvalid    = !dosageAmount.trim();
    const daysInvalid      = daysOfWeek.length === 0;
    const coverNameInvalid = privacyMode && !coverName.trim();
    const parsedStart = parseMMDDYYYY(startDateText);
    const startDateInvalid = !parsedStart;
    const parsedEnd = endDateText.trim() ? parseMMDDYYYY(endDateText) : null;
    const endDateInvalid = endDateText.trim() && (!parsedEnd || (parsedStart && parsedEnd < parsedStart));
    const newTimeErrors    = reminderHours.map(h => !h.trim());

    const refillError = validateRefillDate(refillDate);

    setNameError(nameInvalid);
    setDosageError(dosageInvalid);
    setDaysError(daysInvalid);
    setCoverNameError(coverNameInvalid);
    setStartDateError(startDateInvalid ? 'Start date is required.' : '');
    setEndDateError(endDateInvalid ? 'End date cannot be before start date.' : '');
    setTimeErrors(newTimeErrors);
    setRefillDateError(refillError);
    if (nameInvalid || dosageInvalid || daysInvalid || coverNameInvalid || startDateInvalid || endDateInvalid || newTimeErrors.some(Boolean) || refillError) return;
    const dosage = `${dosageAmount.trim()}${dosageUnit}`;
    const builtTimes = reminderHours.map((h, i) => `${clampTime(h)} ${reminderPeriods[i]}`);
    const reminderTime = builtTimes[0];
    const doseCount = reminderHours.length;
    if (isEditing && medId) {
      updateMedication(medId, {
        name: name.trim(),
        standardizedName,
        rxcui,
        coverName: coverName.trim() || undefined,
        dosage,
        frequency,
        reminderTime,
        reminderTimes: builtTimes,
        color: selectedColor,
        iconName: selectedIcon,
        iconCategory: iconTab,
        daysOfWeek,
        isPRN: frequency === 'as-needed',
        privacyMode,
        startDate: mmddyyyyToISO(startDateText),
        endDate: endDateText.trim() ? mmddyyyyToISO(endDateText) : undefined,
        refillDate: refillDate.trim() || undefined,
        dosesTakenToday: new Array(doseCount).fill(false),
        totalDosesToday: doseCount,
      });
      navigation.goBack();
    } else {
      addMedication({
        name: name.trim(),
        standardizedName,
        rxcui,
        coverName: coverName.trim() || undefined,
        dosage,
        frequency,
        reminderTime,
        reminderTimes: builtTimes,
        color: selectedColor,
        iconName: selectedIcon,
        iconCategory: iconTab,
        daysOfWeek,
        isPRN: frequency === 'as-needed',
        privacyMode,
        isActive: true,
        startDate: mmddyyyyToISO(startDateText),
        endDate: endDateText.trim() ? mmddyyyyToISO(endDateText) : undefined,
        refillDate: refillDate.trim() || undefined,
        dosesTakenToday: new Array(doseCount).fill(false),
        totalDosesToday: doseCount,
      });
      if (fromTab) {
        navigation.goBack();
      } else {
        navigation.navigate('NotificationSetup');
      }
    }
  }

  const icons = iconTab === 'med' ? MED_ICONS : NEUTRAL_ICONS;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <View style={s.backArr}>
            <MaterialCommunityIcons name="plus" size={16} color={colors.mintD} />
          </View>
          <Text style={s.backLabel}>Add medication</Text>
        </TouchableOpacity>
<Text style={s.note}>Add {displayName}'s daily medications. You can always add or edit later.</Text>

        <Text style={s.lbl}>Medication name <Text style={{ color: colors.rose }}>Required</Text></Text>
        <MedicationSearch
          value={name}
          onSelect={handleMedicationSelect}
          onManuallEnter={handleManualMedicationEntry}
          placeholder="Search medications or type name..."
          error={nameError}
        />
        {nameError && <Text style={s.errorText}>Please enter a medication name to continue.</Text>}

        {/* Drugs.com Link */}
        {selectedMedication && drugsComLink && (
          <TouchableOpacity
            style={s.viewDetailsBtn}
            onPress={handleViewDetails}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.mint} />
            <Text style={s.viewDetailsText}>View Details on Drugs.com</Text>
            <MaterialCommunityIcons name="external-link" size={14} color={colors.mint} />
          </TouchableOpacity>
        )}

        <Text style={s.lbl}>Dosage <Text style={{ color: colors.rose }}>Required</Text></Text>
        <View style={s.dosageRow}>
          <TextInput
            style={[s.inp, s.dosageAmountInp, dosageError && s.inpError]}
            placeholder="e.g. 250"
            placeholderTextColor="#b0bec5"
            keyboardType="numeric"
            value={dosageAmount}
            onChangeText={(t) => {
              const digits = t.replace(/\D/g, '');
              const clamped = digits === '' ? '' : String(Math.min(parseInt(digits, 10), 999));
              setDosageAmount(clamped);
              if (clamped.trim()) setDosageError(false);
            }}
          />
          <View style={s.unitDropWrapper}>
            <TouchableOpacity style={s.unitDropBtn} onPress={() => setUnitDropOpen((o) => !o)} activeOpacity={0.8}>
              <Text style={s.unitDropBtnText}>{dosageUnit}</Text>
              <MaterialCommunityIcons name={unitDropOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.navy} />
            </TouchableOpacity>
            {unitDropOpen && (
              <View style={s.unitDropMenu}>
                {(['mg', 'mL'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[s.unitDropItem, dosageUnit === u && s.unitDropItemOn]}
                    onPress={() => { setDosageUnit(u); setUnitDropOpen(false); }}
                  >
                    <Text style={[s.unitDropItemText, dosageUnit === u && s.unitDropItemTextOn]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        {dosageError && <Text style={s.errorText}>Please enter a dosage amount to continue.</Text>}

        {/* Refill Date */}
        <View style={s.refillSection}>
          <View style={s.refillHead}>
            <MaterialCommunityIcons name="calendar-refresh" size={14} color={colors.mintD} />
            <Text style={s.refillTitle}>Refill Date</Text>
            <View style={s.optionalBadge}><Text style={s.optionalText}>Optional</Text></View>
          </View>
          <Text style={s.refillHelper}>We'll remind you 3 days before this date to refill.</Text>
          <TextInput
            style={[s.inp, { marginBottom: 0 }, !!refillDateError && s.inpError]}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#b0bec5"
            keyboardType="numeric"
            value={refillDate}
            maxLength={10}
            onChangeText={(t) => {
              setRefillDate(formatDateInput(t));
              if (refillDateError) setRefillDateError('');
            }}
            onBlur={() => setRefillDateError(validateRefillDate(refillDate))}
          />
          {!!refillDateError && <Text style={[s.errorText, { marginTop: 6 }]}>{refillDateError}</Text>}
        </View>

        {/* Cover Name */}
        <View style={[s.coverSection, coverNameError && s.coverSectionErr]}>
          <View style={s.coverHead}>
            <MaterialCommunityIcons name="eye-off" size={14} color={colors.mintD} />
            <Text style={s.coverTitle}>Cover Name</Text>
            {privacyMode ? (
              <View style={s.requiredBadge}><Text style={s.optionalText}>Required</Text></View>
            ) : (
              <View style={s.optionalBadge}><Text style={s.optionalText}>Optional</Text></View>
            )}
          </View>
          <Text style={s.coverHelper}>Use a private nickname to hide the real name in notifications.</Text>
          <TextInput
            style={[s.coverInp, coverNameError && s.coverInpErr]}
            placeholder='e.g. "Morning Vitamin"'
            placeholderTextColor="#b8cfc8"
            value={coverName}
            onChangeText={(t) => { setCoverName(t); if (t.trim()) setCoverNameError(false); }}
          />
        </View>

        {coverNameError && <Text style={s.errorText}>A cover name is required when hiding medication names.</Text>}

        {/* Privacy toggle */}
        <View style={s.privacyRow}>
          <MaterialCommunityIcons name="lock" size={16} color="#7a50a0" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.privacyLabel}>Hide medication names in notifications</Text>
            <Text style={s.privacySub}>Always use cover name</Text>
          </View>
          <Switch
            value={privacyMode}
            onValueChange={(v) => { setPrivacy(v); if (!v) setCoverNameError(false); }}
            trackColor={{ false: colors.border, true: colors.mint }}
            thumbColor="#fff"
          />
        </View>

        <Text style={s.lbl}>Days Taken <Text style={{ color: colors.rose }}>Required</Text></Text>
        <View style={s.dayRow}>
          {DAYS.map((day) => {
            const on = daysOfWeek.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[s.dayChip, on && s.dayChipOn, daysError && !on && s.dayChipErr]}
                onPress={() => {
                  setDaysOfWeek(prev =>
                    prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                  );
                  setDaysError(false);
                }}
              >
                <Text style={[s.dayChipText, on && s.dayChipTextOn]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {daysError && <Text style={s.errorText}>Please select at least one day.</Text>}

        <Text style={s.lbl}>Start Date <Text style={{ color: colors.rose }}>Required</Text></Text>
        <View style={[s.dateInputRow, !!startDateError && s.dateInputRowErr]}>
          <TextInput
            style={s.dateTextInp}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#b0bec5"
            keyboardType="numeric"
            value={startDateText}
            maxLength={10}
            onChangeText={(t) => {
              setStartDateText(formatDateInput(t));
              if (startDateError) setStartDateError('');
            }}
          />
          <TouchableOpacity onPress={() => setShowStartPicker(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.mint} />
          </TouchableOpacity>
        </View>
        <DateTimePickerModal
          isVisible={showStartPicker}
          mode="date"
          date={parseMMDDYYYY(startDateText) ?? new Date()}
          onConfirm={(d) => {
            setShowStartPicker(false);
            setStartDateText(dateToMMDDYYYY(d));
            setStartDateError('');
          }}
          onCancel={() => setShowStartPicker(false)}
        />
        {!!startDateError && <Text style={s.errorText}>{startDateError}</Text>}

        <Text style={s.lbl}>End Date <Text style={{ color: colors.mint }}>Optional</Text></Text>
        <View style={[s.dateInputRow, !!endDateError && s.dateInputRowErr]}>
          <TextInput
            style={s.dateTextInp}
            placeholder="MM/DD/YYYY (leave blank if ongoing)"
            placeholderTextColor="#b0bec5"
            keyboardType="numeric"
            value={endDateText}
            maxLength={10}
            onChangeText={(t) => {
              setEndDateText(formatDateInput(t));
              if (endDateError) setEndDateError('');
            }}
          />
          <TouchableOpacity onPress={() => setShowEndPicker(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.mint} />
          </TouchableOpacity>
        </View>
        <DateTimePickerModal
          isVisible={showEndPicker}
          mode="date"
          date={parseMMDDYYYY(endDateText) ?? new Date()}
          onConfirm={(d) => {
            setShowEndPicker(false);
            setEndDateText(dateToMMDDYYYY(d));
            setEndDateError('');
          }}
          onCancel={() => setShowEndPicker(false)}
        />
        {!!endDateError && <Text style={s.errorText}>{endDateError}</Text>}

        <Text style={s.lbl}>Frequency <Text style={{ color: colors.rose }}>Required</Text></Text>
        <View style={s.chips}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity key={f} style={[s.chip, frequency === f && s.chipOn]} onPress={() => handleFreqChange(f)}>
              <Text style={[s.chipText, frequency === f && s.chipTextOn]}>{FREQ_LABELS[f]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.lbl}>Reminder time <Text style={{ color: colors.rose }}>Required</Text></Text>
        {reminderHours.map((hour, i) => (
          <View key={i} style={{ zIndex: 19 - i }}>
            {(reminderHours.length > 1 || frequency === 'as-needed') && (
              <View style={s.reminderIndexRow}>
                <Text style={s.reminderIndexLbl}>Reminder {i + 1}</Text>
                {frequency === 'as-needed' && reminderHours.length > 1 && (
                  <TouchableOpacity onPress={() => removeReminderSlot(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.rose} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={s.timeRow}>
              <TextInput
                style={[s.inp, s.timeInp, timeErrors[i] && s.inpError]}
                placeholder="e.g. 2:30"
                placeholderTextColor="#b0bec5"
                keyboardType="numeric"
                value={hour}
                onChangeText={(t) => {
                  const formatted = formatTimeInput(t);
                  setHours(prev => prev.map((h, j) => j === i ? formatted : h));
                  if (formatted.trim()) setTimeErrors(prev => prev.map((e, j) => j === i ? false : e));
                }}
                onBlur={() => {
                  if (hour.trim()) setHours(prev => prev.map((h, j) => j === i ? clampTime(h) : h));
                }}
              />
              <View style={s.periodWrapper}>
                <TouchableOpacity style={s.unitDropBtn} onPress={() => setPeriodOpen(periodDropOpen === i ? null : i)} activeOpacity={0.8}>
                  <Text style={s.unitDropBtnText}>{reminderPeriods[i]}</Text>
                  <MaterialCommunityIcons name={periodDropOpen === i ? 'chevron-up' : 'chevron-down'} size={16} color={colors.navy} />
                </TouchableOpacity>
                {periodDropOpen === i && (
                  <View style={s.unitDropMenu}>
                    {(['AM', 'PM'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[s.unitDropItem, reminderPeriods[i] === p && s.unitDropItemOn]}
                        onPress={() => {
                          setPeriods(prev => prev.map((v, j) => j === i ? p : v));
                          setPeriodOpen(null);
                        }}
                      >
                        <Text style={[s.unitDropItemText, reminderPeriods[i] === p && s.unitDropItemTextOn]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            {timeErrors[i] && <Text style={s.errorText}>Please enter a reminder time to continue.</Text>}
          </View>
        ))}
        {frequency === 'as-needed' && (
          <TouchableOpacity style={s.addSlotBtn} onPress={addReminderSlot}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.mint} />
            <Text style={s.addSlotText}>Add reminder time</Text>
          </TouchableOpacity>
        )}

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
          <Text style={s.btnText}>{isEditing ? 'Save Changes' : 'Next →'}</Text>
        </TouchableOpacity>
        {!isEditing && (
          <TouchableOpacity
            style={s.btnSecondary}
            onPress={() => fromTab ? navigation.goBack() : navigation.navigate('NotificationSetup')}
          >
            <Text style={s.btnSecondaryText}>{fromTab ? 'Cancel' : 'Skip for now'}</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Drug Interaction Modal */}
      <DrugInteractionModal
        visible={showInteractionModal}
        interaction={pendingInteraction}
        onProceed={() => setShowInteractionModal(false)}
        onCancel={() => {
          setShowInteractionModal(false);
          handleMedicationSelect(null);
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  backArr: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.mintL, alignItems: 'center', justifyContent: 'center' },
  backLabel: { fontSize: 14, fontFamily: fonts.bold, color: colors.navy },
  note: { fontSize: fontSizes.xs, color: colors.muted, lineHeight: 16, marginBottom: 14 },
  lbl: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  inp: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy, marginBottom: 12 },
  coverSection: { backgroundColor: '#f0faf5', borderWidth: 1.5, borderColor: '#c8e8d8', borderRadius: 14, padding: 12, marginBottom: 10 },
  coverSectionErr: { borderColor: colors.rose, backgroundColor: colors.roseL },
  coverInpErr: { borderColor: colors.rose },
  requiredBadge: { backgroundColor: colors.rose, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
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
  inpError: { borderColor: colors.rose },
  errorText: { fontSize: fontSizes.xs, color: colors.rose, marginTop: -8, marginBottom: 12 },
  btnPrimary: { backgroundColor: colors.mint, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
  btnSecondary: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center' },
  btnSecondaryText: { color: colors.muted, fontFamily: fonts.medium, fontSize: fontSizes.base },
  dosageRow: { flexDirection: 'row', gap: 8, marginBottom: 12, zIndex: 20 },
  dosageAmountInp: { flex: 1, marginBottom: 0 },
  unitDropWrapper: { width: 88, zIndex: 20 },
  timeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  timeInp: { flex: 1, marginBottom: 0 },
  periodWrapper: { width: 88 },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#f0faf8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mint,
  },
  viewDetailsText: {
    flex: 1,
    fontSize: fontSizes.body,
    fontFamily: fonts.medium,
    color: colors.mint,
    marginHorizontal: 8,
  },
  reminderIndexRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  reminderIndexLbl: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted },
  dayRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  dayChip: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dayChipOn: { backgroundColor: colors.mintL, borderColor: colors.mintM },
  dayChipErr: { borderColor: colors.rose },
  dayChipText: { fontSize: fontSizes.xs - 1, fontFamily: fonts.bold, color: colors.muted },
  dayChipTextOn: { color: colors.mintD },
  refillSection: { backgroundColor: '#f0faf5', borderWidth: 1.5, borderColor: '#c8e8d8', borderRadius: 14, padding: 12, marginBottom: 14 },
  refillHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  refillTitle: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.mintD, flex: 1 },
  refillHelper: { fontSize: fontSizes.xs, color: colors.muted, lineHeight: 15, marginBottom: 8 },
  addSlotBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginBottom: 4 },
  addSlotText: { fontSize: fontSizes.sm, fontFamily: fonts.bold, color: colors.mint },
  unitDropBtn: {
    height: 46, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  unitDropBtnText: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  unitDropMenu: {
    position: 'absolute', top: 50, left: 0, right: 0,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 10, overflow: 'hidden', zIndex: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 20,
  },
  unitDropItem: { paddingVertical: 11, alignItems: 'center' },
  unitDropItemOn: { backgroundColor: colors.mintL },
  unitDropItemText: { fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy },
  unitDropItemTextOn: { fontFamily: fonts.bold, color: colors.mintD },
  dateInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
    marginBottom: 12, gap: 8,
  },
  dateInputRowErr: { borderColor: colors.rose },
  dateTextInp: {
    flex: 1, fontSize: fontSizes.base, fontFamily: fonts.regular,
    color: colors.navy, padding: 0,
  },
});
