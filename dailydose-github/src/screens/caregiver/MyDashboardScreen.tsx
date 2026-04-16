// screens/caregiver/MyDashboardScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';

export default function MyDashboardScreen() {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.switchBar}>
          <View>
            <Text style={s.switchLabel}>Current Account</Text>
            <Text style={s.switchName}>My Account</Text>
          </View>
          <TouchableOpacity style={s.switchBtn} onPress={() => navigation.navigate('AccountSwitcher')}>
            <Text style={s.switchBtnText}>Switch ⇄</Text>
          </TouchableOpacity>
        </View>
        <View style={s.header}>
          <Text style={s.logo}>Daily<Text style={{ color: colors.mint }}>Dose</Text>+</Text>
          <View style={s.avatar}><Text style={s.avatarText}>SS</Text></View>
        </View>
        <Text style={s.greetSmall}>Good morning,</Text>
        <Text style={s.greetBig}>Sofia 👋</Text>
        <View style={s.progressCard}>
          <Text style={s.cardLabel}>My progress today</Text>
          <Text style={s.cardBig}>0 <Text style={s.cardTotal}>/ 0</Text></Text>
          <Text style={s.cardSub}>No medications added yet</Text>
        </View>
        <Text style={s.sectionHead}>My medications</Text>
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>💊</Text>
          <Text style={s.emptyTitle}>No medications yet</Text>
          <Text style={s.emptyText}>Add your personal medications to get started.</Text>
          <TouchableOpacity style={s.addBtn}><Text style={s.addBtnText}>+ Add medication</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16 },
  switchBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 10, marginBottom: 12 },
  switchLabel: { fontSize: fontSizes.xs - 1, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  switchName: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy, marginTop: 1 },
  switchBtn: { backgroundColor: colors.mintL, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  switchBtnText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logo: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.mintL, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD },
  greetSmall: { fontSize: fontSizes.sm, color: colors.muted, marginBottom: 2 },
  greetBig: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy, marginBottom: 14 },
  progressCard: { backgroundColor: colors.mint, borderRadius: 18, padding: 18, marginBottom: 18 },
  cardLabel: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  cardBig: { fontSize: 32, fontFamily: fonts.bold, color: '#fff' },
  cardTotal: { fontSize: 16, fontFamily: fonts.regular, opacity: 0.8 },
  cardSub: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sectionHead: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  emptyState: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', borderRadius: 14, padding: 20, alignItems: 'center' } as any,
  emptyIcon: { fontSize: 22, marginBottom: 8 },
  emptyTitle: { fontSize: fontSizes.md, fontFamily: fonts.bold, color: colors.navy, marginBottom: 4 },
  emptyText: { fontSize: fontSizes.xs, color: colors.muted, textAlign: 'center', marginBottom: 12 },
  addBtn: { backgroundColor: colors.mint, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: '#fff' },
});
