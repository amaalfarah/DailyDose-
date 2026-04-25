// components/SubscribeModal.tsx
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { useSettingsStore } from '../store/useSettingsStore';

const FEATURES = [
  { icon: 'pill', label: 'Unlimited medications & reminders' },
  { icon: 'account-heart-outline', label: 'Caregiver account sharing' },
  { icon: 'eye-off-outline', label: 'Cover names & privacy mode' },
  { icon: 'bell-ring-outline', label: 'Missed dose & refill alerts' },
  { icon: 'translate', label: 'Multilingual support (EN, ES, FR, AR)' },
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

export default function SubscribeModal() {
  const { showSubscribeModal, dismissSubscribeModal, subscribe } = useSettingsStore();

  const [step, setStep] = useState<'plan' | 'card'>('plan');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  function handleClose() {
    dismissSubscribeModal();
    setTimeout(() => setStep('plan'), 300);
  }

  function handleSubscribe() {
    subscribe();
    setTimeout(() => setStep('plan'), 300);
  }

  const displayNumber = cardNumber
    ? cardNumber.padEnd(19, '·').slice(0, 19)
    : '···· ···· ···· ····';
  const displayName = cardName || 'FULL NAME';
  const displayExpiry = expiry || 'MM/YY';

  return (
    <Modal visible={showSubscribeModal} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.overlay}>
          <View style={s.sheet}>

            {/* Header */}
            <View style={s.header}>
              {step === 'card' ? (
                <TouchableOpacity onPress={() => setStep('plan')} style={s.backBtn}>
                  <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
                </TouchableOpacity>
              ) : (
                <View style={s.backBtn} />
              )}
              <Text style={s.headerTitle}>
                {step === 'plan' ? 'Subscription Plans' : 'Add Card'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={s.backBtn}>
                <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {step === 'plan' ? (
                <>
                  {/* Plan intro */}
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
                        <MaterialCommunityIcons name={f.icon as any} size={16} color="rgba(255,255,255,0.85)" />
                        <Text style={s.featureLabel}>{f.label}</Text>
                      </View>
                    ))}
                    <TouchableOpacity style={s.addCardBtn} onPress={() => setStep('card')}>
                      <Text style={s.addCardBtnText}>Add Payment Method</Text>
                    </TouchableOpacity>
                  </View>

                  {/* FAQ */}
                  <Text style={s.faqHead}>Frequently asked questions</Text>
                  {[
                    { q: 'Can I cancel anytime?', a: 'Yes — cancel anytime from Settings with no fees or penalties.' },
                    { q: 'What happens to my data if I cancel?', a: 'Your medications and history are saved for 90 days so you can re-subscribe without losing anything.' },
                    { q: 'Is a credit card required for the free trial?', a: 'No. The 30-day trial requires no payment info upfront.' },
                  ].map((item, i) => (
                    <View key={i} style={s.faqItem}>
                      <MaterialCommunityIcons name="plus" size={16} color={colors.muted} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.faqQ}>{item.q}</Text>
                        <Text style={s.faqA}>{item.a}</Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <>
                  {/* Card preview */}
                  <View style={s.cardPreview}>
                    <View style={s.cardPreviewInner}>
                      <View style={s.cardTopRow}>
                        <Text style={s.cardBrand}>DailyDose+</Text>
                        <MaterialCommunityIcons name="nfc" size={22} color="rgba(255,255,255,0.7)" />
                      </View>
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
                        <MaterialCommunityIcons name="credit-card-outline" size={28} color="rgba(255,255,255,0.5)" />
                      </View>
                    </View>
                  </View>

                  {/* Form */}
                  <View style={s.form}>
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
                      <View style={{ width: 16 }} />
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

                    <TouchableOpacity style={s.subscribeBtn} onPress={handleSubscribe}>
                      <Text style={s.subscribeBtnText}>Subscribe — $5/month</Text>
                    </TouchableOpacity>

                    <Text style={s.fine}>
                      By subscribing you agree to be billed $5/month. Cancel anytime in Settings.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,31,46,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  backBtn: { width: 36, alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: colors.navy },

  // Plan step
  planIntro: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.navy,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 4,
    paddingHorizontal: 24,
  },
  planSub: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 24,
  },
  planCard: {
    backgroundColor: colors.mint,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  crown: { alignSelf: 'center', marginBottom: 8 },
  planPrice: {
    fontSize: 36,
    fontFamily: fonts.bold,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  planPer: { fontSize: fontSizes.sm, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  featureLabel: { fontSize: fontSizes.sm, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.9)' },
  addCardBtn: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  addCardBtnText: { color: colors.mintD, fontFamily: fonts.bold, fontSize: fontSizes.base },

  // FAQ
  faqHead: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.navy,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  faqItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqQ: { fontSize: fontSizes.sm, fontFamily: fonts.bold, color: colors.navy, marginBottom: 4 },
  faqA: { fontSize: fontSizes.xs, fontFamily: fonts.regular, color: colors.muted, lineHeight: 16 },

  // Card step
  cardPreview: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  cardPreviewInner: {
    backgroundColor: colors.mintD,
    borderRadius: 18,
    padding: 20,
    shadowColor: colors.mintD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardBrand: { fontSize: fontSizes.sm, fontFamily: fonts.bold, color: '#fff' },
  cardNum: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardMeta: { fontSize: 9, fontFamily: fonts.bold, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8 },
  cardMetaVal: { fontSize: fontSizes.xs, fontFamily: fonts.bold, color: '#fff', marginTop: 2 },

  // Form
  form: { paddingHorizontal: 16 },
  fieldLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.navy,
  },
  row: { flexDirection: 'row' },
  subscribeBtn: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  subscribeBtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: fontSizes.base },
  fine: {
    fontSize: fontSizes.xs - 1,
    color: '#b0bec5',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
