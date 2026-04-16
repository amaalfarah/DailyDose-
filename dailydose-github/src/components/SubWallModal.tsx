// components/SubWallModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { useSettingsStore } from '../store/useSettingsStore';

export default function SubWallModal() {
  const { subscribe } = useSettingsStore();

  return (
    <Modal visible transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.icon}>🔒</Text>
          <Text style={s.title}>Your trial has ended</Text>
          <Text style={s.sub}>Subscribe to continue tracking your medications and keep your data safe.</Text>
          <View style={s.priceBox}>
            <Text style={s.price}>$5</Text>
            <Text style={s.period}>per month · cancel anytime</Text>
          </View>
          <TouchableOpacity style={s.btnPrimary} onPress={subscribe}>
            <Text style={s.btnPrimaryText}>Subscribe Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary}>
            <Text style={s.btnSecondaryText}>Remind me later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,31,46,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 22, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.3, shadowRadius: 40, elevation: 20 },
  icon: { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: fontSizes.base, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  priceBox: { backgroundColor: colors.mintL, borderRadius: 12, padding: 14, width: '100%', alignItems: 'center', marginBottom: 16 },
  price: { fontSize: 34, fontFamily: fonts.bold, color: colors.mintD },
  period: { fontSize: fontSizes.xs, color: colors.muted, marginTop: 4 },
  btnPrimary: { backgroundColor: colors.mint, borderRadius: 12, padding: 14, alignItems: 'center', width: '100%', marginBottom: 10 },
  btnPrimaryText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
  btnSecondary: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center', width: '100%' },
  btnSecondaryText: { color: colors.muted, fontFamily: fonts.medium, fontSize: fontSizes.base },
});
