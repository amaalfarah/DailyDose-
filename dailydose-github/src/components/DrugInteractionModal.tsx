/**
 * DrugInteractionModal Component
 * Shows warning when a potential drug interaction is detected
 * Allows user to proceed despite the warning
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { DrugInteraction } from '../services/medicationApi';

interface DrugInteractionModalProps {
  visible: boolean;
  interaction: DrugInteraction | null;
  onProceed: () => void;
  onCancel: () => void;
}

const DrugInteractionModal: React.FC<DrugInteractionModalProps> = ({
  visible,
  interaction,
  onProceed,
  onCancel,
}) => {
  if (!interaction) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Major':
        return colors.rose;
      case 'Moderate':
        return '#f59e0b';
      case 'Minor':
        return '#10b981';
      default:
        return colors.navy;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Major':
        return 'alert-circle';
      case 'Moderate':
        return 'alert';
      case 'Minor':
        return 'information';
      default:
        return 'information';
    }
  };

  const severityColor = getSeverityColor(interaction.severity);
  const severityIcon = getSeverityIcon(interaction.severity);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <View style={s.modalContainer}>
          {/* Header */}
          <View style={[s.header, { borderBottomColor: severityColor }]}>
            <MaterialCommunityIcons
              name={severityIcon}
              size={24}
              color={severityColor}
            />
            <Text style={[s.headerText, { color: severityColor }]}>
              {interaction.severity} Interaction
            </Text>
          </View>

          {/* Content */}
          <View style={s.content}>
            <View style={s.drugPairContainer}>
              <View style={s.drugItem}>
                <Text style={s.drugLabel}>Medication 1</Text>
                <Text style={s.drugName}>{interaction.drug1}</Text>
              </View>

              <View style={s.interactionIcon}>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color={severityColor}
                />
              </View>

              <View style={s.drugItem}>
                <Text style={s.drugLabel}>Medication 2</Text>
                <Text style={s.drugName}>{interaction.drug2}</Text>
              </View>
            </View>

            <View style={[s.descriptionBox, { borderLeftColor: severityColor }]}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={severityColor}
                style={s.descriptionIcon}
              />
              <View style={s.descriptionContent}>
                <Text style={s.descriptionLabel}>Potential Interaction</Text>
                <Text style={s.descriptionText}>{interaction.description}</Text>
              </View>
            </View>

            <View style={s.warningBox}>
              <Text style={s.warningText}>
                ⚠️ Please consult your healthcare provider before adding this medication
                combination.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.button, s.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={s.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.button, s.proceedButton, { borderColor: severityColor }]}
              onPress={onProceed}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={severityColor}
                style={{ marginRight: 6 }}
              />
              <Text style={[s.proceedButtonText, { color: severityColor }]}>
                Proceed Anyway
              </Text>
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <Text style={s.disclaimer}>
            This is not medical advice. Always consult with your healthcare provider about
            potential drug interactions.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default DrugInteractionModal;

// ============ STYLES ============

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxWidth: 380,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    backgroundColor: '#fafbfc',
  },
  headerText: {
    fontSize: fontSizes.subtitle,
    fontFamily: fonts.semibold,
    marginLeft: 10,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  drugPairContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
  },
  drugItem: {
    flex: 1,
  },
  drugLabel: {
    fontSize: fontSizes.small,
    fontFamily: fonts.regular,
    color: '#7a90a0',
    marginBottom: 4,
  },
  drugName: {
    fontSize: fontSizes.body,
    fontFamily: fonts.semibold,
    color: colors.navy,
  },
  interactionIcon: {
    marginHorizontal: 12,
  },
  descriptionBox: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  descriptionIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  descriptionContent: {
    flex: 1,
  },
  descriptionLabel: {
    fontSize: fontSizes.small,
    fontFamily: fonts.semibold,
    color: colors.navy,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: fontSizes.small,
    fontFamily: fonts.regular,
    color: '#6b7280',
    lineHeight: 18,
  },
  warningBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.rose,
  },
  warningText: {
    fontSize: fontSizes.small,
    fontFamily: fonts.regular,
    color: colors.rose,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f2f5',
  },
  cancelButtonText: {
    fontSize: fontSizes.body,
    fontFamily: fonts.semibold,
    color: colors.navy,
  },
  proceedButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  proceedButtonText: {
    fontSize: fontSizes.body,
    fontFamily: fonts.semibold,
  },
  disclaimer: {
    fontSize: fontSizes.tiny,
    fontFamily: fonts.regular,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 16,
  },
});
