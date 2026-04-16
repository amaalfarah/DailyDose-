// screens/meds/MedsScreen.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useMedStore, Medication } from '../../store/useMedStore';

export default function MedsScreen() {
  const navigation = useNavigation<any>();
  const { medications, deleteMedication, updateMedication } = useMedStore();
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  function openMenu(med: Medication) {
    setSelectedMed(med);
    setSheetVisible(true);
  }

  function closeMenu() {
    setSheetVisible(false);
    setSelectedMed(null);
  }

  function handleDelete() {
    if (!selectedMed) return;
    Alert.alert(
      'Delete Medication',
      `Permanently remove ${selectedMed.name} and all its reminders? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: closeMenu },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMedication(selectedMed.id);
            closeMenu();
          },
        },
      ]
    );
  }

  function handleTogglePRN() {
    if (!selectedMed) return;
    updateMedication(selectedMed.id, { isPRN: !selectedMed.isPRN });
    closeMenu();
  }

  const badgeStyle = (status: string) => {
    if (status === 'refillSoon') return [styles.badge, styles.badgeAmber];
    return [styles.badge, styles.badgeMint];
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Daily<Text style={{ color: colors.mint }}>Dose</Text>+</Text>
        <Text style={styles.headerTitle}>My Medications</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHead}>Luis's medications</Text>

        {medications.map((med) => (
          <View key={med.id} style={styles.medRow}>
            <View style={[styles.medIcon, { backgroundColor: med.color }]}>
              <MaterialCommunityIcons
                name={med.iconName as any}
                size={18}
                color={colors.mintD}
              />
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
              {/* Three-dot menu */}
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
        onPress={() => navigation.navigate('Meds', { screen: 'AddMedication' })}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Edit bottom sheet */}
      {sheetVisible && selectedMed && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <TouchableOpacity
            style={styles.sheet}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />

            {/* Med header */}
            <View style={styles.sheetHead}>
              <View style={[styles.sheetIcon, { backgroundColor: selectedMed.color }]}>
                <MaterialCommunityIcons
                  name={selectedMed.iconName as any}
                  size={18}
                  color={colors.mintD}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetMedName}>{selectedMed.name}</Text>
                <Text style={styles.sheetMedSub}>{selectedMed.dosage} · {selectedMed.frequency}</Text>
              </View>
              <TouchableOpacity onPress={closeMenu}>
                <Text style={{ fontSize: 18, color: colors.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              {/* Appearance */}
              <Text style={styles.sheetSectionLabel}>Appearance</Text>
              <SheetAction
                icon="palette"
                iconBg={colors.blueL}
                iconColor={colors.blueD}
                label="Edit Icon & Color"
                sub="Change symbol, color, or cover name"
                onPress={() => { closeMenu(); navigation.navigate('AddMedication'); }}
              />

              {/* Dosage */}
              <Text style={styles.sheetSectionLabel}>Dosage</Text>
              <SheetAction
                icon="pill"
                iconBg={colors.roseL}
                iconColor={colors.rose}
                label="Edit Dose"
                sub={`Current: ${selectedMed.dosage}`}
                onPress={() => { closeMenu(); Alert.alert('Edit Dose', 'Open dose editor'); }}
              />

              {/* Schedule */}
              <Text style={styles.sheetSectionLabel}>Schedule</Text>
              <SheetAction
                icon="calendar-clock"
                iconBg={colors.mintL}
                iconColor={colors.mintD}
                label="Edit Schedule"
                sub="Update times, frequency, or dates"
                onPress={() => { closeMenu(); Alert.alert('Edit Schedule', 'Open schedule editor'); }}
              />

              {/* PRN toggle */}
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

              {/* Delete */}
              <Text style={styles.sheetSectionLabel}>Danger Zone</Text>
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
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </SafeAreaView>
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
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  overlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(15,31,46,0.5)',
    justifyContent: 'flex-end',
  } as any,
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32,
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
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  deleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
  },
  deleteLabel: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.rose },
});
