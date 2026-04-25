// screens/settings/SubscriptionScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useSettingsStore } from '../../store/useSettingsStore';

const FEATURES = [
  { icon: 'pill',                  label: 'Unlimited medications & reminders' },
  { icon: 'account-heart-outline', label: 'Caregiver account sharing' },
  { icon: 'eye-off-outline',       label: 'Cover names & privacy mode' },
  { icon: 'bell-ring-outline',     label: 'Missed dose & refill alerts' },
  { icon: 'translate',             label: 'Multilingual support (EN, ES, FR, AR)' },
];

const FAQS = [
  { q: 'Can I cancel anytime?',                  a: 'Yes — cancel anytime from Settings with no fees or penalties.' },
  { q: 'What happens to my data if I cancel?',   a: 'Your medications and history are saved for 90 days so you can re-subscribe without losing anything.' },
  { q: 'Is a credit card required for the trial?', a: 'No. The 30-day trial requires no payment info upfront.' },
];

function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { subscribe, isSubscribed } = useSettingsStore();

  const [step, setStep] = useState<'plan' | 'card'>('plan');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [cardName, setCardName]     = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');

  function handleBack() {
    if (step === 'card') { setStep('plan'); return; }
    navigation.goBack();
  }

  function handleSubscribe() {
    subscribe();
    navigation.goBack();
  }

  const displayNumber = cardNumber
    ? cardNumber.padEnd(19, '·').slice(0, 19)
    : '···· ···· ···· ····';
  const displayName   = cardName   || 'FULL NAME';
  const displayExpiry = expiry     || 'MM/YY';

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} style={s.headerBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {step === 'plan' ? 'Subscription Plans' : 'Add Card'}
          </Text>
          <View style={s.headerBtn} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'plan' ? (
            <>
              <Text style={s.planIntro}>Subscribe to DailyDose+</Text>
              <Text style={s.planSub}>Full access to every feature, cancel anytime.</Text>

              {/* Plan card */}
              <View style={s.planCard}>
                <MaterialCommunityIcons name="crown-outline" size={32} color="#fff" style={s.crown} />
                <Text style={s.planPrice}>
                  $5<Text style={s.planPer}>/month</Text>
                </Text>
                {FEATURES.map((f, i) => (
                  <View key={i} style={s.featureRow}>
                    <MaterialCommunityIcons name={f.icon as any} size={15} color="rgba(255,255,255,0.85)" />
                    <Text style={s.featureLabel}>{f.label}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={s.addCardBtn}
                  onPress={() => setStep('card')}
                  activeOpacity={0.85}
                >
                  <Text style={s.addCardBtnText}>
                    {isSubscribed ? 'Manage Payment Method' : 'Add Payment Method'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* FAQ */}
              <Text style={s.faqHead}>Frequently asked questions</Text>
              {FAQS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={s.faqItem}
                    onPress={() => setOpenFaq(isOpen ? null : i)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.faqQ}>{item.q}</Text>
                      {isOpen && <Text style={s.faqA}>{item.a}</Text>}
                    </View>
                    <MaterialCommunityIcons
                      name={isOpen ? 'minus' : 'plus'}
                      size={18}
                      color={isOpen ? colors.mint : colors.muted}
                    />
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            <>
              {/* Card preview */}
              <View style={s.cardPreview}>
                <Text style={s.cardBrand}>DailyDose+</Text>
                <MaterialCommunityIcons name="nfc" size={22} color="rgba(255,255,255,0.6)" style={s.nfc} />
                <Text style={s.cardNum}>{displayNumber}</Text>
                <View style={s.cardBottomRow}>
                  <View>
                    <Text style={s.cardMeta}>CARDHOLDER</Text>
                    <Text style={s.cardMetaVal}>{displayName.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={s.cardMeta}>EXPIRES</Text>
                    <Text style={s.cardMetaVal}>{displayExpiry}</Text>
                  </View>
                  <MaterialCommunityIcons name="credit-card-outline" size={28} color="rgba(255,255,255,0.4)" />
                </View>
              </View>

              {/* Form */}
              <Text style={s.fieldLabel}>Cardholder Name</Text>
              <TextInput
                style={s.input}
                placeholder="Maria Santos"
                placeholderTextColor="#b0bec5"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="words"
              />

              <Text style={s.fieldLabel}>Card Number</Text>
              <TextInput
                style={s.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#b0bec5"
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                keyboardType="numeric"
                maxLength={19}
              />

              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Expiry Date</Text>
                  <TextInput
                    style={s.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#b0bec5"
                    value={expiry}
                    onChangeText={(t) => setExpiry(formatExpiry(t))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={{ width: 14 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>CVV</Text>
                  <TextInput
                    style={s.input}
                    placeholder="···"
                    placeholderTextColor="#b0bec5"
                    value={cvv}
                    onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                  />
                </View>
              </View>

              <TouchableOpacity style={s.subscribeBtn} onPress={handleSubscribe} activeOpacity={0.85}>
                <Text style={s.subscribeBtnText}>Subscribe — $5/month</Text>
              </TouchableOpacity>

              <Text style={s.fine}>
                By subscribing you agree to be billed $5/month. Cancel anytime in Settings.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 36, alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },

  scroll: { padding: 16, paddingBottom: 40 },

  // Plan step
  planIntro: {
    fontSize: 20, fontFamily: fonts.bold, color: colors.navy,
    textAlign: 'center', marginTop: 4, marginBottom: 4,
  },
  planSub: {
    fontSize: fontSizes.sm, color: colors.muted,
    textAlign: 'center', marginBottom: 18,
  },
  planCard: {
    backgroundColor: colors.mint,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  crown: { alignSelf: 'center', marginBottom: 8 },
  planPrice: {
    fontSize: 36, fontFamily: fonts.bold, color: '#fff',
    textAlign: 'center', marginBottom: 16,
  },
  planPer: { fontSize: fontSizes.sm, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  featureLabel: { fontSize: fontSizes.sm, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.9)' },
  addCardBtn: {
    backgroundColor: colors.white, borderRadius: 12,
    padding: 14, alignItems: 'center', marginTop: 18,
  },
  addCardBtnText: { color: colors.mintD, fontFamily: fonts.bold, fontSize: fontSizes.base },

  faqHead: {
    fontSize: fontSizes.base, fontFamily: fonts.bold,
    color: colors.navy, marginBottom: 12,
  },
  faqItem: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1.5, borderColor: colors.border,
  },
  faqQ: { fontSize: fontSizes.sm, fontFamily: fonts.bold, color: colors.navy, marginBottom: 3 },
  faqA: { fontSize: fontSizes.xs, fontFamily: fonts.regular, color: colors.muted, lineHeight: 16 },

  // Card step
  cardPreview: {
    backgroundColor: colors.mintD,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.mintD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBrand: { fontSize: fontSizes.sm, fontFamily: fonts.bold, color: '#fff' },
  nfc: { position: 'absolute', top: 20, right: 20 },
  cardNum: {
    fontSize: 18, fontFamily: fonts.bold, color: '#fff',
    letterSpacing: 2, marginTop: 24, marginBottom: 20,
  },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardMeta: { fontSize: 9, fontFamily: fonts.bold, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8 },
  cardMetaVal: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: '#fff', marginTop: 2 },

  // Form
  fieldLabel: {
    fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6, marginTop: 14,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy,
  },
  row: { flexDirection: 'row' },
  subscribeBtn: {
    backgroundColor: colors.mint, borderRadius: 12,
    padding: 15, alignItems: 'center', marginTop: 24,
    shadowColor: colors.mint, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  subscribeBtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
  fine: {
    fontSize: fontSizes.xs - 1, color: '#b0bec5',
    textAlign: 'center', marginTop: 12, lineHeight: 16,
  },
});
