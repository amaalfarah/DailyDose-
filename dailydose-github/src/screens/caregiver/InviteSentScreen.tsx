// screens/caregiver/InviteSentScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';

export default function InviteSentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { caregiverName = '', caregiverEmail = '' } = route.params || {};
  const initials = caregiverName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.icon}>✉️</Text>
        <Text style={s.title}>Invite sent!</Text>
        <Text style={s.sub}>An invite link has been sent to <Text style={s.bold}>{caregiverName}</Text>. Once they sign up, they'll be able to help manage your medications.</Text>
      </View>
      <View style={s.body}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Pending caregiver</Text>
          <View style={s.row}>
            <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.cgName}>{caregiverName}</Text>
              <Text style={s.cgSub}>Invite pending · View &amp; log access</Text>
            </View>
            <View style={s.pendingBadge}><Text style={s.pendingText}>Pending</Text></View>
          </View>
        </View>
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('AccountSwitcher')}>
          <Text style={s.btnText}>View accounts →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnOut} onPress={() => navigation.navigate('Settings')}>
          <Text style={s.btnOutText}>Back to settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 18, fontFamily: fonts.bold, color: colors.navy, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: fontSizes.base, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  bold: { fontFamily: fonts.bold, color: colors.navy },
  body: { padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0eeff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.blueD },
  cgName: { fontSize: fontSizes.md, fontFamily: fonts.bold, color: colors.navy },
  cgSub: { fontSize: fontSizes.xs, color: colors.muted },
  pendingBadge: { backgroundColor: colors.amberL, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pendingText: { fontSize: fontSizes.xs - 1, fontFamily: fonts.bold, color: colors.amberD },
  btn: { backgroundColor: colors.mint, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
  btnOut: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 13, alignItems: 'center' },
  btnOutText: { color: colors.muted, fontFamily: fonts.medium, fontSize: fontSizes.base },
});
