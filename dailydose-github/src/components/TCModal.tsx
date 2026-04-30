// components/TCModal.tsx
import React, { useState } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Pressable,
} from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import ContactSupportModal from './ContactSupportModal';

interface Props {
  visible: boolean;
  onDecline: () => void;
  onAccept: () => void;
}

const sections = [
  {
    title: 'Medication Tracking Disclaimer',
    text: 'This app is designed to help users track medications, schedules, and reminders only. It does not provide medical advice, diagnose medical conditions, or replace consultation with a licensed healthcare provider. Always follow the instructions provided by your doctor, pharmacist, or prescription label.',
  },
  {
    title: 'Missed Dose Warning',
    text: 'If you miss a dose, consult your pharmacist or doctor before taking extra medication.',
  },
  {
    title: 'Emergency Warning',
    text: 'Do not use this app for emergency medical decisions. In case of a medical emergency, contact emergency services or a healthcare provider immediately.',
  },
  {
    title: 'Notification Warning',
    text: 'Reminder alerts may fail if phone notifications are disabled, battery-saving settings are active, or device connectivity is interrupted. Users are responsible for ensuring notifications remain enabled.',
  },
  {
    title: 'User Responsibility',
    text: 'You are responsible for entering accurate medication information, dosage schedules, and reminder settings.',
  },
  {
    title: 'Privacy Notice',
    text: 'The App is a standalone consumer tool and is not a "Covered Entity" or "Business Associate" as defined under HIPAA. Consequently, the health information you input is not "Protected Health Information" (PHI) governed by HIPAA. Instead, your data is protected under our standard Privacy Policy and applicable consumer protection laws, such as FTC\'s Health Breach Notification.',
  },
];

export default function TCModal({ visible, onDecline, onAccept }: Props) {
  const [checked, setChecked] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);

  function handleClose() {
    setChecked(false);
    onDecline();
  }

  function handleAccept() {
    if (!checked) return;
    setChecked(false);
    onAccept();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>

          {/* Header */}
          <View style={styles.head}>
            <Text style={styles.title}>Terms & Conditions</Text>
            <View style={styles.divider} />
          </View>

          {/* Scrollable body */}
          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {sections.map((s, i) => (
              <View key={i} style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionBar} />
                  <Text style={styles.sectionTitle}>{s.title}</Text>
                </View>
                <Text style={styles.sectionText}>{s.text}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Checkbox row */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setChecked(!checked)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, checked && styles.checkboxOn]}>
              {checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>
              I understand and agree to the Terms & Conditions.
            </Text>
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnDecline} onPress={handleClose}>
              <Text style={styles.btnDeclineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnAccept, !checked && styles.btnAcceptDisabled]}
              onPress={handleAccept}
              disabled={!checked}
            >
              <Text style={styles.btnAcceptText}>Accept & Continue</Text>
            </TouchableOpacity>
          </View>

          {/* Contact & Support Button */}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => setShowContactSupport(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.contactButtonText}>Contact & Support</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>

      {/* Contact Support Modal */}
      <ContactSupportModal
        visible={showContactSupport}
        onClose={() => setShowContactSupport(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,31,46,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 20,
  },
  head: { padding: 16, paddingBottom: 0 },
  title: { fontSize: 15, fontFamily: fonts.bold, color: colors.navy, marginBottom: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 10 },
  body: { paddingHorizontal: 16, paddingTop: 12, maxHeight: 320 },
  section: { marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sectionBar: { width: 3, height: 12, backgroundColor: colors.mint, borderRadius: 2 },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.mintD,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  sectionText: { fontSize: 10.5, fontFamily: fonts.regular, color: '#4a5f70', lineHeight: 16 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#f7fbf9',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.mintM,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.mint, borderColor: colors.mint },
  checkmark: { color: colors.white, fontSize: 11, fontFamily: fonts.bold },
  checkLabel: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    color: colors.navy,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  btnDecline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 11,
    alignItems: 'center',
  },
  btnDeclineText: { fontSize: fontSizes.base, fontFamily: fonts.medium, color: colors.muted },
  btnAccept: {
    flex: 2,
    backgroundColor: colors.mint,
    borderRadius: 10,
    padding: 11,
    alignItems: 'center',
  },
  btnAcceptDisabled: { opacity: 0.4 },
  btnAcceptText: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.white },
  contactButton: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: colors.mintL,
  },
  contactButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.mint,
  },
});
