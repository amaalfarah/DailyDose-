// screens/meds/MedsScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useMedStore, Medication } from '../../store/useMedStore';
import { useAuthStore } from '../../store/useAuthStore';

const COLORS = ['#e3f7f0', '#fdedf2', '#eaf2fb', '#fef3e7', '#f0eafb', '#fafaea'];
const MED_ICONS = [
  { name: 'pill' }, { name: 'needle' }, { name: 'stethoscope' },
  { name: 'bottle-tonic' }, { name: 'flask' }, { name: 'heart-pulse' },
];
const NEUTRAL_ICONS = [
  { name: 'star' }, { name: 'heart' }, { name: 'white-balance-sunny' },
  { name: 'leaf' }, { name: 'water' }, { name: 'snowflake' },
];
const FREQUENCIES = ['daily', 'twice-daily', '3x-daily', 'as-needed'] as const;
const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily', 'twice-daily': 'Twice daily',
  '3x-daily': '3× daily', 'as-needed': 'As needed',
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

function clampTime(val: string): string {
  if (!val) return '';
  const parts = val.includes(':') ? val.split(':') : [val, '0'];
  let h = parseInt(parts[0]) || 1;
  let m = parseInt(parts[1] || '0') || 0;
  h = Math.min(Math.max(h, 1), 12);
  m = Math.min(Math.max(m, 0), 59);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (!digits) return '';
  if (digits.length === 1) return digits;
  const first = parseInt(digits[0]);
  if (first >= 2 || first === 0) return `${digits[0]}:${digits.slice(1, 3)}`;
  const second = parseInt(digits[1]);
  if (second <= 2) {
    if (digits.length === 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
  return `${digits[0]}:${digits.slice(1, 3)}`;
}

type EditMode = 'icon' | 'dose' | 'schedule' | 'coverName' | null;

export default function MedsScreen() {
  const navigation = useNavigation<any>();
  const { medications, deleteMedication, updateMedication } = useMedStore();
  const { user, pendingName } = useAuthStore();
  const displayName = user?.name || pendingName || 'there';

  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Icon & Color edit state
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editIconTab, setEditIconTab] = useState<'med' | 'neutral'>('med');

  // Dose edit state
  const [editDosageAmount, setEditDosageAmount] = useState('');
  const [editDosageUnit, setEditDosageUnit] = useState<'mg' | 'mL'>('mg');
  const [editUnitDropOpen, setEditUnitDropOpen] = useState(false);

  // Cover name edit state
  const [editCoverName, setEditCoverName] = useState('');

  // Schedule edit state
  const [editFreq, setEditFreq] = useState<typeof FREQUENCIES[number]>('daily');
  const [editHours, setEditHours] = useState<string[]>(['']);
  const [editPeriods, setEditPeriods] = useState<('AM' | 'PM')[]>(['AM']);
  const [editPeriodDropOpen, setEditPeriodDropOpen] = useState<number | null>(null);

  function openMenu(med: Medication) {
    setSelectedMed(med);
    setSheetVisible(true);
  }

  function closeAll() {
    setSheetVisible(false);
    setEditMode(null);
    setSelectedMed(null);
    setShowDeleteConfirm(false);
    setEditUnitDropOpen(false);
    setEditPeriodDropOpen(null);
  }

  function openEditCoverName() {
    if (!selectedMed) return;
    setEditCoverName(selectedMed.coverName ?? '');
    setSheetVisible(false);
    setEditMode('coverName');
  }

  function saveCoverName() {
    if (!selectedMed) return;
    updateMedication(selectedMed.id, { coverName: editCoverName.trim() || undefined });
    closeAll();
  }

  function handleTogglePrivacy() {
    if (!selectedMed) return;
    updateMedication(selectedMed.id, { privacyMode: !selectedMed.privacyMode });
    setSelectedMed({ ...selectedMed, privacyMode: !selectedMed.privacyMode });
  }

  function openEditIcon() {
    if (!selectedMed) return;
    setEditColor(selectedMed.color);
    setEditIcon(selectedMed.iconName);
    setEditIconTab(selectedMed.iconCategory ?? 'med');
    setSheetVisible(false);
    setEditMode('icon');
  }

  function openEditDose() {
    if (!selectedMed) return;
    const { amount, unit } = parseDosage(selectedMed.dosage);
    setEditDosageAmount(amount);
    setEditDosageUnit(unit);
    setEditUnitDropOpen(false);
    setSheetVisible(false);
    setEditMode('dose');
  }

  function openEditSchedule() {
    if (!selectedMed) return;
    setEditFreq(selectedMed.frequency);
    const times = selectedMed.reminderTimes?.map(parseReminderTime) ?? [{ hour: '', period: 'AM' as const }];
    setEditHours(times.map((t) => t.hour));
    setEditPeriods(times.map((t) => t.period));
    setEditPeriodDropOpen(null);
    setSheetVisible(false);
    setEditMode('schedule');
  }

  function saveIconColor() {
    if (!selectedMed) return;
    updateMedication(selectedMed.id, { color: editColor, iconName: editIcon, iconCategory: editIconTab });
    closeAll();
  }

  function saveDose() {
    if (!selectedMed || !editDosageAmount.trim()) return;
    updateMedication(selectedMed.id, { dosage: `${editDosageAmount.trim()}${editDosageUnit}` });
    closeAll();
  }

  function saveSchedule() {
    if (!selectedMed || editHours.some((h) => !h.trim())) return;
    const builtTimes = editHours.map((h, i) => `${clampTime(h)} ${editPeriods[i]}`);
    const doseCount = editFreq === 'twice-daily' ? 2 : editFreq === '3x-daily' ? 3 : 1;
    updateMedication(selectedMed.id, {
      frequency: editFreq,
      reminderTime: builtTimes[0],
      reminderTimes: builtTimes,
      isPRN: editFreq === 'as-needed',
      dosesTakenToday: new Array(doseCount).fill(false),
      totalDosesToday: doseCount,
    });
    closeAll();
  }

  function handleFreqChange(f: typeof FREQUENCIES[number]) {
    const count = f === 'twice-daily' ? 2 : f === '3x-daily' ? 3 : 1;
    setEditFreq(f);
    setEditHours((prev) => {
      const next = [...prev];
      while (next.length < count) next.push('');
      return next.slice(0, count);
    });
    setEditPeriods((prev) => {
      const next = [...prev];
      while (next.length < count) next.push('AM' as const);
      return next.slice(0, count);
    });
  }

  function handleDelete() {
    setShowDeleteConfirm(true);
  }

  function confirmDelete() {
    if (!selectedMed) return;
    deleteMedication(selectedMed.id);
    closeAll();
  }

  function handleTogglePRN() {
    if (!selectedMed) return;
    updateMedication(selectedMed.id, { isPRN: !selectedMed.isPRN });
    closeAll();
  }

  const badgeStyle = (status: string) =>
    status === 'refillSoon' ? [styles.badge, styles.badgeAmber] : [styles.badge, styles.badgeMint];

  const editIcons = editIconTab === 'med' ? MED_ICONS : NEUTRAL_ICONS;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Daily<Text style={{ color: colors.mint }}>Dose</Text>+</Text>
        <Text style={styles.headerTitle}>My Medications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHead}>{displayName}'s medications</Text>

        {medications.map((med) => (
          <View key={med.id} style={styles.medRow}>
            <View style={[styles.medIcon, { backgroundColor: med.color }]}>
              <MaterialCommunityIcons name={med.iconName as any} size={18} color={colors.mintD} />
            </View>
            <View style={styles.medInfo}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medTime}>
                {med.dosage} · {med.frequency === '3x-daily' ? '3× daily' : med.frequency}
              </Text>
            </View>
            <View style={styles.medRight}>
              <View style={med.dosage === '400IU' ? badgeStyle('refillSoon') : badgeStyle('active')}>
                <Text style={styles.badgeText}>
                  {med.isPRN ? 'PRN' : med.dosage === '400IU' ? 'Refill soon' : 'Active'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.dotBtn}
                onPress={() => openMenu(med)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedication', { fromTab: true })}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ── Main options sheet ── */}
      {sheetVisible && selectedMed && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeAll}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <View style={[styles.sheetIcon, { backgroundColor: selectedMed.color }]}>
                <MaterialCommunityIcons name={selectedMed.iconName as any} size={18} color={colors.mintD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetMedName}>{selectedMed.name}</Text>
                <Text style={styles.sheetMedSub}>{selectedMed.dosage} · {selectedMed.frequency}</Text>
              </View>
              <TouchableOpacity onPress={closeAll}>
                <Text style={{ fontSize: 18, color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.sheetSectionLabel}>Dosage</Text>
              <SheetAction
                icon="pill" iconBg={colors.roseL} iconColor={colors.rose}
                label="Edit Dose" sub={`Current: ${selectedMed.dosage}`}
                onPress={openEditDose}
              />
              <Text style={styles.sheetSectionLabel}>Schedule</Text>
              <SheetAction
                icon="calendar-clock" iconBg={colors.mintL} iconColor={colors.mintD}
                label="Edit Schedule" sub="Update times or frequency"
                onPress={openEditSchedule}
              />
              <Text style={styles.sheetSectionLabel}>Appearance</Text>
              <SheetAction
                icon="palette" iconBg={colors.blueL} iconColor={colors.blueD}
                label="Edit Icon & Color" sub="Change symbol or color"
                onPress={openEditIcon}
              />
              <Text style={styles.sheetSectionLabel}>Privacy</Text>
              <SheetAction
                icon="eye-off" iconBg="#f5eeff" iconColor="#7a50a0"
                label={selectedMed.coverName ? 'Edit Cover Name' : 'Add Cover Name'}
                sub={selectedMed.coverName ? `Cover: ${selectedMed.coverName}` : 'Use a private nickname in notifications'}
                onPress={openEditCoverName}
              />
              <View style={styles.prnRow}>
                <View style={[styles.sheetActionIcon, { backgroundColor: '#f5eeff' }]}>
                  <MaterialCommunityIcons name="bell-off" size={16} color="#7a50a0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetActionLabel}>Hide name in notifications</Text>
                  <Text style={styles.sheetActionSub}>Always use cover name or generic text</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, selectedMed.privacyMode && styles.toggleOn]}
                  onPress={handleTogglePrivacy}
                >
                  <View style={[styles.toggleThumb, selectedMed.privacyMode && styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetSectionLabel}>Status</Text>
              <View style={styles.prnRow}>
                <View style={[styles.sheetActionIcon, { backgroundColor: colors.amberL }]}>
                  <MaterialCommunityIcons name="help-circle" size={16} color={colors.amberD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetActionLabel}>Mark as PRN (As Needed)</Text>
                  <Text style={styles.sheetActionSub}>Switch from fixed to as-needed</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, selectedMed.isPRN && styles.toggleOn]}
                  onPress={handleTogglePRN}
                >
                  <View style={[styles.toggleThumb, selectedMed.isPRN && styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetSectionLabel}>Danger Zone</Text>
              {showDeleteConfirm ? (
                <View style={styles.deleteConfirm}>
                  <Text style={styles.deleteConfirmText}>
                    Remove <Text style={{ fontFamily: fonts.bold }}>{selectedMed.name}</Text>? This cannot be undone.
                  </Text>
                  <View style={styles.deleteConfirmBtns}>
                    <TouchableOpacity
                      style={styles.deleteCancelBtn}
                      onPress={() => setShowDeleteConfirm(false)}
                    >
                      <Text style={styles.deleteCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDelete}>
                      <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.deleteRow} onPress={handleDelete}>
                  <View style={[styles.sheetActionIcon, { backgroundColor: colors.roseL }]}>
                    <MaterialCommunityIcons name="trash-can" size={16} color={colors.rose} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deleteLabel}>Delete Medication</Text>
                    <Text style={styles.sheetActionSub}>Permanently remove this entry</Text>
                  </View>
                  <Text style={{ color: colors.rose, fontSize: 16 }}>›</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* ── Edit Icon & Color sheet ── */}
      {editMode === 'icon' && selectedMed && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeAll}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <MiniSheetHeader
              title="Icon & Color"
              onBack={() => { setEditMode(null); setSheetVisible(true); }}
              onClose={closeAll}
            />
            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetSectionLabel}>Color</Text>
              <View style={styles.colorRow}>
                {COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, editColor === c && styles.colorSwatchOn]}
                    onPress={() => setEditColor(c)}
                  />
                ))}
              </View>

              <Text style={styles.sheetSectionLabel}>Icon</Text>
              <View style={styles.iconTabs}>
                <TouchableOpacity
                  style={[styles.iconTab, editIconTab === 'med' && styles.iconTabOn]}
                  onPress={() => setEditIconTab('med')}
                >
                  <MaterialCommunityIcons name="pill" size={14} color={editIconTab === 'med' ? colors.mint : colors.muted} />
                  <Text style={[styles.iconTabText, editIconTab === 'med' && styles.iconTabTextOn]}>Medication</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconTab, editIconTab === 'neutral' && styles.iconTabNeutralOn]}
                  onPress={() => setEditIconTab('neutral')}
                >
                  <MaterialCommunityIcons name="leaf" size={14} color={editIconTab === 'neutral' ? '#9b59b6' : colors.muted} />
                  <Text style={[styles.iconTabText, editIconTab === 'neutral' && { color: '#6a2fa0' }]}>Neutral</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.iconGrid}>
                {editIcons.map((ic) => (
                  <TouchableOpacity
                    key={ic.name}
                    style={[
                      styles.iconOpt,
                      editIcon === ic.name && (editIconTab === 'neutral' ? styles.iconOptNeutralOn : styles.iconOptOn),
                    ]}
                    onPress={() => setEditIcon(ic.name)}
                  >
                    <MaterialCommunityIcons
                      name={ic.name as any} size={22}
                      color={editIcon === ic.name ? (editIconTab === 'neutral' ? '#6a2fa0' : colors.mintD) : colors.muted}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Live preview */}
              <View style={styles.previewRow}>
                <View style={[styles.previewIcon, { backgroundColor: editColor }]}>
                  <MaterialCommunityIcons name={editIcon as any} size={20} color={colors.mintD} />
                </View>
                <Text style={styles.previewLabel}>Preview</Text>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveIconColor}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <View style={{ height: 16 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* ── Edit Dose sheet ── */}
      {editMode === 'dose' && selectedMed && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeAll}>
          <TouchableOpacity style={[styles.sheet, { zIndex: 10 }]} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <MiniSheetHeader
              title="Edit Dose"
              onBack={() => { setEditMode(null); setSheetVisible(true); }}
              onClose={closeAll}
            />
            <View style={[styles.sheetBody, { paddingBottom: 24 }]}>
              <Text style={styles.sheetSectionLabel}>Dosage Amount</Text>
              <View style={styles.doseRow}>
                <TextInput
                  style={styles.doseInput}
                  keyboardType="numeric"
                  placeholder="e.g. 250"
                  placeholderTextColor="#b0bec5"
                  value={editDosageAmount}
                  onChangeText={(t) => {
                    const digits = t.replace(/\D/g, '');
                    setEditDosageAmount(digits === '' ? '' : String(Math.min(parseInt(digits, 10), 999)));
                  }}
                />
                <View style={{ zIndex: 20 }}>
                  <TouchableOpacity
                    style={styles.unitBtn}
                    onPress={() => setEditUnitDropOpen((o) => !o)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.unitBtnText}>{editDosageUnit}</Text>
                    <MaterialCommunityIcons
                      name={editUnitDropOpen ? 'chevron-up' : 'chevron-down'}
                      size={16} color={colors.navy}
                    />
                  </TouchableOpacity>
                  {editUnitDropOpen && (
                    <View style={styles.unitMenu}>
                      {(['mg', 'mL'] as const).map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[styles.unitMenuItem, editDosageUnit === u && styles.unitMenuItemOn]}
                          onPress={() => { setEditDosageUnit(u); setEditUnitDropOpen(false); }}
                        >
                          <Text style={[styles.unitMenuItemText, editDosageUnit === u && styles.unitMenuItemTextOn]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={saveDose}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* ── Edit Schedule sheet ── */}
      {editMode === 'schedule' && selectedMed && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeAll}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <MiniSheetHeader
              title="Edit Schedule"
              onBack={() => { setEditMode(null); setSheetVisible(true); }}
              onClose={closeAll}
            />
            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetSectionLabel}>Frequency</Text>
              <View style={styles.freqChips}>
                {FREQUENCIES.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqChip, editFreq === f && styles.freqChipOn]}
                    onPress={() => handleFreqChange(f)}
                  >
                    <Text style={[styles.freqChipText, editFreq === f && styles.freqChipTextOn]}>
                      {FREQ_LABELS[f]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sheetSectionLabel}>Reminder Time{editHours.length > 1 ? 's' : ''}</Text>
              {editHours.map((hour, i) => (
                <View key={i} style={{ zIndex: 19 - i, marginBottom: 10 }}>
                  {editHours.length > 1 && (
                    <Text style={styles.reminderIndexLbl}>Reminder {i + 1}</Text>
                  )}
                  <View style={styles.timeRow}>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="e.g. 8:00"
                      placeholderTextColor="#b0bec5"
                      keyboardType="numeric"
                      value={hour}
                      onChangeText={(t) => {
                        const formatted = formatTimeInput(t);
                        setEditHours((prev) => prev.map((h, j) => j === i ? formatted : h));
                      }}
                      onBlur={() => {
                        if (hour.trim()) setEditHours((prev) => prev.map((h, j) => j === i ? clampTime(h) : h));
                      }}
                    />
                    <View style={{ zIndex: 20 }}>
                      <TouchableOpacity
                        style={styles.unitBtn}
                        onPress={() => setEditPeriodDropOpen(editPeriodDropOpen === i ? null : i)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.unitBtnText}>{editPeriods[i]}</Text>
                        <MaterialCommunityIcons
                          name={editPeriodDropOpen === i ? 'chevron-up' : 'chevron-down'}
                          size={16} color={colors.navy}
                        />
                      </TouchableOpacity>
                      {editPeriodDropOpen === i && (
                        <View style={styles.unitMenu}>
                          {(['AM', 'PM'] as const).map((p) => (
                            <TouchableOpacity
                              key={p}
                              style={[styles.unitMenuItem, editPeriods[i] === p && styles.unitMenuItemOn]}
                              onPress={() => {
                                setEditPeriods((prev) => prev.map((v, j) => j === i ? p : v));
                                setEditPeriodDropOpen(null);
                              }}
                            >
                              <Text style={[styles.unitMenuItemText, editPeriods[i] === p && styles.unitMenuItemTextOn]}>{p}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.saveBtn} onPress={saveSchedule}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <View style={{ height: 16 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* ── Cover Name mini-sheet ── */}
      {editMode === 'coverName' && selectedMed && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeAll}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <MiniSheetHeader
              title={selectedMed.coverName ? 'Edit Cover Name' : 'Add Cover Name'}
              onBack={() => { setEditMode(null); setSheetVisible(true); }}
              onClose={closeAll}
            />
            <View style={[styles.sheetBody, { paddingBottom: 24 }]}>
              <Text style={styles.sheetSectionLabel}>Cover Name</Text>
              <TextInput
                style={styles.coverNameInput}
                placeholder='e.g. "Morning Vitamin"'
                placeholderTextColor="#b8cfc8"
                value={editCoverName}
                onChangeText={setEditCoverName}
                autoFocus
              />
              <Text style={styles.coverNameHelper}>
                This name will appear instead of the real medication name in notifications when privacy mode is on.
              </Text>
              {selectedMed.coverName ? (
                <TouchableOpacity
                  style={styles.removeCoverBtn}
                  onPress={() => {
                    updateMedication(selectedMed.id, { coverName: undefined });
                    closeAll();
                  }}
                >
                  <Text style={styles.removeCoverText}>Remove Cover Name</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.saveBtn} onPress={saveCoverName}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function MiniSheetHeader({ title, onBack, onClose }: { title: string; onBack: () => void; onClose: () => void }) {
  return (
    <View style={styles.sheetHead}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ fontSize: 22, color: colors.muted, lineHeight: 24 }}>‹</Text>
      </TouchableOpacity>
      <Text style={[styles.sheetMedName, { flex: 1, textAlign: 'center' }]}>{title}</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ fontSize: 18, color: colors.muted }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function SheetAction({ icon, iconBg, iconColor, label, sub, onPress }: any) {
  return (
    <TouchableOpacity style={styles.sheetAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.sheetActionIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sheetActionLabel}>{label}</Text>
        <Text style={styles.sheetActionSub}>{sub}</Text>
      </View>
      <Text style={{ color: colors.muted, fontSize: 16 }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  logo: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy },
  headerTitle: { fontSize: fontSizes.md, fontFamily: fonts.bold, color: colors.navy },
  scroll: { padding: 16, paddingBottom: 100 },
  sectionHead: {
    fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  medRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1.5, borderColor: colors.border,
  },
  medIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  medInfo: { flex: 1 },
  medName: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  medTime: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  medRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeMint: { backgroundColor: colors.mintL },
  badgeAmber: { backgroundColor: colors.amberL },
  badgeText: { fontSize: fontSizes.xs - 1, fontFamily: fonts.bold, color: colors.mintD },
  dotBtn: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4a5568' },
  fab: {
    position: 'absolute', bottom: 80, right: 16,
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.mint, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(15,31,46,0.5)',
    justifyContent: 'flex-end',
  } as any,
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32, maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetMedName: { fontSize: fontSizes.md, fontFamily: fonts.bold, color: colors.navy },
  sheetMedSub: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  sheetBody: { paddingHorizontal: 16, paddingTop: 4 },
  sheetSectionLabel: {
    fontSize: fontSizes.xs - 1, fontFamily: fonts.bold, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingTop: 10, paddingBottom: 4,
  },
  sheetAction: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f4f3',
  },
  sheetActionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetActionLabel: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  sheetActionSub: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 1 },
  prnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f4f3',
  },
  toggle: {
    width: 36, height: 20, borderRadius: 10,
    backgroundColor: colors.border, justifyContent: 'center', padding: 2,
  },
  toggleOn: { backgroundColor: colors.mint },
  toggleThumb: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  deleteLabel: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.rose },
  deleteConfirm: {
    backgroundColor: colors.roseL, borderRadius: 12,
    padding: 14, marginTop: 4, marginBottom: 4,
  },
  deleteConfirmText: {
    fontSize: fontSizes.sm, color: colors.rose, marginBottom: 12, lineHeight: 18,
  },
  deleteConfirmBtns: { flexDirection: 'row', gap: 8 },
  deleteCancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 10, padding: 10, alignItems: 'center',
    backgroundColor: colors.white,
  },
  deleteCancelText: { fontSize: fontSizes.sm, fontFamily: fonts.bold, color: colors.muted },
  deleteConfirmBtn: {
    flex: 1, backgroundColor: colors.rose,
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  deleteConfirmBtnText: { fontSize: fontSizes.sm, fontFamily: fonts.bold, color: '#fff' },
  // Icon & Color edit
  colorRow: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2.5, borderColor: 'transparent' },
  colorSwatchOn: { borderColor: colors.navy },
  iconTabs: {
    flexDirection: 'row', borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, overflow: 'hidden', marginBottom: 10,
  },
  iconTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  iconTabOn: { borderBottomColor: colors.mint, backgroundColor: colors.mintL },
  iconTabNeutralOn: { borderBottomColor: '#9b59b6', backgroundColor: '#f5eeff' },
  iconTabText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted },
  iconTabTextOn: { color: colors.mintD },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  iconOpt: {
    width: 52, height: 52, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center',
  },
  iconOptOn: { borderColor: colors.mint, backgroundColor: colors.mintL },
  iconOptNeutralOn: { borderColor: '#9b59b6', backgroundColor: '#f5eeff' },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bg, borderRadius: 12, padding: 10, marginBottom: 14,
  },
  previewIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewLabel: { fontSize: fontSizes.sm, fontFamily: fonts.bold, color: colors.muted },
  // Dose edit
  doseRow: { flexDirection: 'row', gap: 8, marginBottom: 16, zIndex: 20 },
  doseInput: {
    flex: 1, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy,
  },
  unitBtn: {
    height: 46, width: 88, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  unitBtnText: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  unitMenu: {
    position: 'absolute', top: 50, left: 0, right: 0,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 10, overflow: 'hidden', zIndex: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 20,
  },
  unitMenuItem: { paddingVertical: 11, alignItems: 'center' },
  unitMenuItemOn: { backgroundColor: colors.mintL },
  unitMenuItemText: { fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy },
  unitMenuItemTextOn: { fontFamily: fonts.bold, color: colors.mintD },
  // Schedule edit
  freqChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  freqChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
  },
  freqChipOn: { backgroundColor: colors.mintL, borderColor: colors.mintM },
  freqChipText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted },
  freqChipTextOn: { color: colors.mintD },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeInput: {
    flex: 1, backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy,
  },
  reminderIndexLbl: {
    fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, marginBottom: 4,
  },
  // Cover name
  coverNameInput: {
    backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: '#c8e8d8', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy,
    marginBottom: 8,
  },
  coverNameHelper: {
    fontSize: fontSizes.xs, color: colors.muted, lineHeight: 16, marginBottom: 14,
  },
  removeCoverBtn: {
    borderWidth: 1.5, borderColor: colors.rose, borderRadius: 10,
    padding: 10, alignItems: 'center', marginBottom: 10,
  },
  removeCoverText: { fontSize: fontSizes.sm, fontFamily: fonts.bold, color: colors.rose },
  // Shared save button
  saveBtn: {
    backgroundColor: colors.mint, borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
});
