// screens/caregiver/AccountSwitcherScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useAuthStore } from '../../store/useAuthStore';

export default function AccountSwitcherScreen() {
  const navigation = useNavigation<any>();
  const { switchAccount, user, sharedAccountOwnerName, savedCaregiverCode } = useAuthStore();
  const myInitials = (user?.name ?? '').split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
  const hasSharedAccess = !!(sharedAccountOwnerName || savedCaregiverCode);
  const ownerName = sharedAccountOwnerName || 'Client';
  const ownerInitials = ownerName.split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);

  function goToMine() {
    switchAccount('mine');
    navigation.navigate('Home');
  }

  function goToShared() {
    switchAccount('shared');
    navigation.navigate('SharedDashboard');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logo}>Daily<Text style={{ color: colors.mint }}>Dose</Text>+</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.pageTitle}>Accounts</Text>
        <Text style={styles.subtitle}>
          Choose an account to manage. Your data is kept separate.
        </Text>

        {/* My Account */}
        <TouchableOpacity style={[styles.card, styles.cardMine]} onPress={goToMine}>
          <View style={styles.cardTop}>
            <View style={[styles.cardAvatar, styles.cardAvatarMine]}>
              <Text style={styles.cardAvatarText}>{myInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Personal</Text>
              <Text style={styles.cardName}>My Account</Text>
            </View>
            <Text style={styles.cardArrow}>›</Text>
          </View>
          <View style={styles.chips}>
            <Chip label="My medications" color="mint" />
            <Chip label="My reminders" color="mint" />
            <Chip label="Personal settings" color="mint" />
          </View>
        </TouchableOpacity>

        {/* Shared Account — shown when a caregiver code has been entered */}
        {hasSharedAccess && (
          <TouchableOpacity style={[styles.card, styles.cardShared]} onPress={goToShared}>
            <View style={styles.cardTop}>
              <View style={[styles.cardAvatar, styles.cardAvatarShared]}>
                <Text style={[styles.cardAvatarText, { color: colors.blueD }]}>{ownerInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardLabel, { color: colors.blueD }]}>
                  Shared · Caregiver access
                </Text>
                <Text style={styles.cardName}>{sharedAccountOwnerName ? `${ownerName}'s Account` : 'Client Account'}</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </View>
            <View style={styles.chips}>
              <Chip label={`${ownerName}'s medications`} color="blue" />
              <Chip label="Mark doses taken" color="blue" />
              <Chip label="View only · Edit locked" color="amber" />
            </View>
          </TouchableOpacity>
        )}

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyTitle}>🔒 Privacy & separation</Text>
          <Text style={styles.privacyText}>
            Your personal medications{hasSharedAccess ? ` and ${ownerName}'s account data` : ''} are fully separate.
            Switching accounts never mixes your data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, color }: { label: string; color: 'mint' | 'blue' | 'amber' }) {
  const bgMap = { mint: colors.mintL, blue: '#e0eeff', amber: colors.amberL };
  const textMap = { mint: colors.mintD, blue: colors.blueD, amber: colors.amberD };
  return (
    <View style={[styles.chip, { backgroundColor: bgMap[color] }]}>
      <Text style={[styles.chipText, { color: textMap[color] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  logo: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy },
  pageTitle: { fontSize: 28, fontFamily: fonts.bold, color: colors.navy, marginTop: 12, marginBottom: 4 },
  closeBtn: { padding: 4 },
  closeIcon: { fontSize: 18, color: colors.muted, fontFamily: fonts.bold },
  subtitle: { fontSize: fontSizes.base, color: colors.muted, marginBottom: 16, lineHeight: 18 },
  card: {
    borderRadius: 16, borderWidth: 2, padding: 14,
    marginBottom: 12,
  },
  cardMine: { borderColor: colors.border, backgroundColor: colors.white },
  cardShared: { borderColor: '#c5d8f0', backgroundColor: '#f5f9ff' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarMine: { backgroundColor: colors.mintL },
  cardAvatarShared: { backgroundColor: '#e0eeff' },
  cardAvatarText: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.mintD },
  cardLabel: { fontSize: fontSizes.xs, color: colors.muted, fontFamily: fonts.bold, textTransform: 'uppercase' },
  cardName: { fontSize: 15, fontFamily: fonts.bold, color: colors.navy },
  cardArrow: { fontSize: 20, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: fontSizes.xs - 1, fontFamily: fonts.bold },
  privacyNote: {
    backgroundColor: colors.mintL, borderRadius: 12, padding: 12,
  },
  privacyTitle: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.mintD, marginBottom: 4 },
  privacyText: { fontSize: fontSizes.xs, color: colors.mintD, lineHeight: 16 },
});
