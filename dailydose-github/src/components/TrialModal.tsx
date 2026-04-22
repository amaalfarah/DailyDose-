// components/TrialModal.tsx
import React from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';

const features = [
  'Unlimited medications & reminders',
  'Caregiver account sharing',
  'Cover names & privacy mode',
  'Missed dose alerts & refill reminders',
  'Multilingual support (EN, ES, FR, AR)',
];

export default function TrialModal() {
  const { showTrialModal, startTrial, subscribe } = useSettingsStore();
  const { startTrial: authStartTrial } = useAuthStore();

  function handleStartTrial() {
    startTrial();
    authStartTrial();
  }

  return (
    <Modal visible={showTrialModal} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.badge}><Text style={styles.badgeText}>Free Trial</Text></View>
            <Text style={styles.days}>30</Text>
            <Text style={styles.daysLabel}>Days Free</Text>
            <Text style={styles.heroSub}>Full access — no credit card required to start.</Text>
          </View>

          <View style={styles.body}>
            {/* Plan row */}
            <View style={styles.planRow}>
              <View>
                <Text style={styles.planName}>DailyDose+ Monthly</Text>
                <Text style={styles.planSub}>After your free trial ends</Text>
              </View>
              <Text style={styles.planPrice}>$5<Text style={styles.planPeriod}>/mo</Text></Text>
            </View>

            {/* Features */}
            {features.map((f, i) => (
              <View key={i} style={styles.feature}>
                <View style={styles.featureCheck} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}

            {/* Warning */}
            <View style={styles.warning}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                After 30 days, access requires an active subscription. Your data is saved.
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleStartTrial}>
              <Text style={styles.btnPrimaryText}>Start 30-Day Free Trial</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={subscribe}>
              <Text style={styles.btnSecondaryText}>Subscribe Now — $5/month</Text>
            </TouchableOpacity>
            <Text style={styles.fine}>Cancel anytime. Billed monthly after trial ends.</Text>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,31,46,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: 22,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.28,
    shadowRadius: 40,
    elevation: 24,
  },
  hero: {
    backgroundColor: colors.mintD,
    padding: 24,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: { color: '#fff', fontSize: fontSizes.xs, fontFamily: fonts.bold, letterSpacing: 0.8 },
  days: { fontSize: 52, fontFamily: fonts.bold, color: '#fff', lineHeight: 56 },
  daysLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: fonts.medium, marginBottom: 6 },
  heroSub: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 16 },
  body: { padding: 18 },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.mintL,
    borderWidth: 1.5,
    borderColor: colors.mintM,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  planName: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },
  planSub: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 2 },
  planPrice: { fontSize: 18, fontFamily: fonts.bold, color: colors.mintD },
  planPeriod: { fontSize: fontSizes.xs, fontFamily: fonts.regular, color: colors.muted },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  featureCheck: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.mint,
  },
  featureText: { fontSize: fontSizes.xs + 1, fontFamily: fonts.regular, color: colors.navy, flex: 1 },
  warning: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: '#fff8f0',
    borderWidth: 1.5,
    borderColor: '#f0d4b0',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  warningIcon: { fontSize: 13 },
  warningText: { flex: 1, fontSize: fontSizes.xs, color: '#7a5030', lineHeight: 16 },
  footer: { paddingHorizontal: 18, paddingBottom: 20, gap: 8 },
  btnPrimary: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },
  btnSecondaryText: { color: colors.muted, fontFamily: fonts.medium, fontSize: fontSizes.base },
  fine: { fontSize: fontSizes.xs - 1, color: '#b0bec5', textAlign: 'center', lineHeight: 14 },
});
