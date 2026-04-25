// components/SubWallModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { useSettingsStore } from '../store/useSettingsStore';
import { navigateTo } from '../navigation/navigationRef';

const features = [
  'Unlimited medications & reminders',
  'Caregiver account sharing',
  'Cover names & privacy mode',
  'Missed dose alerts & refill reminders',
  'Multilingual support (EN, ES, FR, AR)',
];

export default function SubWallModal() {
  const { subscribe } = useSettingsStore();

  return (
    <Modal visible transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.modal}>

          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.upgradeLabel}>Upgrade</Text>
            <Text style={s.heroSub}>Your trial has ended. Subscribe to keep full access.</Text>
          </View>

          <View style={s.body}>
            {/* Plan row */}
            <View style={s.planRow}>
              <View>
                <Text style={s.planName}>DailyDose+ Monthly</Text>
                <Text style={s.planSub}>Billed monthly · cancel anytime</Text>
              </View>
              <Text style={s.planPrice}>$5<Text style={s.planPeriod}>/mo</Text></Text>
            </View>

            {/* Features */}
            {features.map((f, i) => (
              <View key={i} style={s.feature}>
                <View style={s.featureCheck} />
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Button */}
          <View style={s.footer}>
            <TouchableOpacity
              style={s.btnPrimary}
              onPress={() => navigateTo('Settings', { screen: 'Subscription' })}
            >
              <Text style={s.btnPrimaryText}>Subscribe Now — $5/month</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,31,46,0.85)',
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
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  upgradeLabel: {
    fontSize: 40,
    fontFamily: fonts.bold,
    color: '#fff',
    lineHeight: 46,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 16,
  },
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
  footer: { paddingHorizontal: 18, paddingBottom: 20 },
  btnPrimary: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
});
