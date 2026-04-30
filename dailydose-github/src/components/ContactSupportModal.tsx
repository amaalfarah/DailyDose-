// components/ContactSupportModal.tsx
import React from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Pressable, Linking,
} from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ContactSupportModal({ visible, onClose }: Props) {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@dailydoseplus.com');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>

          {/* Header */}
          <View style={styles.head}>
            <Text style={styles.title}>Contact & Support</Text>
            <View style={styles.divider} />
          </View>

          {/* Scrollable body */}
          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Intro paragraph */}
            <Text style={styles.intro}>
              Have questions, feedback, or need help? We're here to assist you. Please reach out using one of the methods below.
            </Text>

            {/* Contact methods section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionBar} />
                <Text style={styles.sectionTitle}>Email Support</Text>
              </View>
              <TouchableOpacity
                style={styles.contactItem}
                onPress={handleEmailPress}
                activeOpacity={0.7}
              >
                <Text style={styles.contactLabel}>Email Address</Text>
                <Text style={styles.contactLink}>support@dailydoseplus.com</Text>
              </TouchableOpacity>
            </View>

            {/* In-app support section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionBar} />
                <Text style={styles.sectionTitle}>In-App Support</Text>
              </View>
              <Text style={styles.supportText}>
                You can access additional help and resources directly within the app through the Settings menu or contact us section.
              </Text>
            </View>

            {/* Response time */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionBar} />
                <Text style={styles.sectionTitle}>Response Time</Text>
              </View>
              <Text style={styles.supportText}>
                We strive to respond to all inquiries within 24-48 business hours. Your feedback helps us improve DailyDose+.
              </Text>
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.btnClose}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
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
  body: { paddingHorizontal: 16, paddingTop: 12, maxHeight: 420 },
  intro: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
    color: colors.slate,
    lineHeight: 16,
    marginBottom: 16,
  },
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
  contactItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.mintL,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.mint,
  },
  contactLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    color: colors.muted,
    marginBottom: 3,
  },
  contactLink: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.mint,
    textDecorationLine: 'underline',
  },
  supportText: {
    fontSize: 10.5,
    fontFamily: fonts.regular,
    color: '#4a5f70',
    lineHeight: 16,
  },
  footer: {
    padding: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  btnClose: {
    backgroundColor: colors.mint,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  btnCloseText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.white,
  },
});
