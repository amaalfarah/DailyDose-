/**
 * MedicationSearch Component
 * Reusable autocomplete input for medication selection
 * Provides suggestions from RxNorm API and fallback to manual entry
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { searchMedications, MedicationSearchResult } from '../services/medicationApi';

interface MedicationSearchProps {
  value: string;
  onSelect: (medication: MedicationSearchResult | null) => void;
  onManuallEnter: (name: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

const MedicationSearch: React.FC<MedicationSearchProps> = ({
  value,
  onSelect,
  onManuallEnter,
  placeholder = 'Search medications...',
  error = false,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<MedicationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicationSearchResult | null>(null);
  const [apiError, setApiError] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Fetch suggestions when query changes
  useEffect(() => {
    const query = searchQuery.trim();

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      setShowManualEntry(false);
      setApiError(false);
      setIsLoading(false);
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      return;
    }

    setIsLoading(true);
    setApiError(false);
    setShowManualEntry(false);

    searchTimeoutRef.current = setTimeout(async () => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const results = await searchMedications(query, 8, controller.signal);
        const validResults = results.filter(med => med && med.displayName && med.rxcui);
        setSuggestions(validResults.slice(0, 8));
        setShowDropdown(true);
        setShowManualEntry(validResults.length === 0);
        setApiError(false);
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }
        console.error('Search error:', error);
        setSuggestions([]);
        setShowDropdown(true);
        setApiError(true);
        setShowManualEntry(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectMedication = (med: MedicationSearchResult) => {
    setSelectedMed(med);
    setSearchQuery(med.displayName);
    onSelect(med);
    setShowDropdown(false);
  };

  const handleManualEntry = () => {
    if (searchQuery.trim()) {
      onManuallEnter(searchQuery.trim());
      setSelectedMed(null);
      setShowDropdown(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedMed(null);
    setSuggestions([]);
    setShowDropdown(false);
    onSelect(null);
  };

  return (
    <View style={s.container}>
      <View style={[s.inputWrapper, error && s.inputWrapperError]}>
        <MaterialCommunityIcons
          name="pill-multiple"
          size={18}
          color={error ? colors.rose : colors.mintD}
          style={s.inputIcon}
        />
        <TextInput
          style={[s.input, error && s.inputError]}
          placeholder={placeholder}
          placeholderTextColor="#b0bec5"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => searchQuery.trim().length >= 3 && setShowDropdown(true)}
          editable={!disabled}
          autoComplete="off"
          autoCorrect={false}
        />
        {isLoading && (
          <ActivityIndicator size="small" color={colors.mint} style={s.loader} />
        )}
        {searchQuery && !isLoading && (
          <TouchableOpacity
            onPress={handleClear}
            style={s.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.navy} />
          </TouchableOpacity>
        )}
        {selectedMed && !isLoading && !searchQuery.includes('×') && (
          <MaterialCommunityIcons
            name="check-circle"
            size={18}
            color={colors.mint}
            style={s.checkIcon}
          />
        )}
      </View>

      {/* API Error Message */}
      {apiError && (
        <View style={s.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={colors.rose} />
          <Text style={s.errorText}>
            Unable to verify medication. Please double-check.
          </Text>
        </View>
      )}

      {/* Dropdown Suggestions */}
      {showDropdown && (
        <View style={s.dropdown}>
          {isLoading ? (
            <View style={s.loadingContainer}>
              <ActivityIndicator size="small" color={colors.mint} />
              <Text style={s.loadingText}>Searching medications...</Text>
            </View>
          ) : suggestions.length > 0 ? (
            <ScrollView style={s.suggestionsList} nestedScrollEnabled>
              {suggestions
                .filter(med => med && med.displayName && med.rxcui)
                .map((med) => (
                <TouchableOpacity
                  key={med.rxcui}
                  style={[
                    s.suggestionItem,
                    selectedMed?.rxcui === med.rxcui && s.suggestionItemSelected,
                  ]}
                  onPress={() => handleSelectMedication(med)}
                  activeOpacity={0.65}
                >
                  <View style={s.suggestionContent}>
                    <Text
                      style={[
                        s.suggestionName,
                        selectedMed?.rxcui === med.rxcui && s.suggestionNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {med.displayName}
                    </Text>
                    <View style={s.suggestionMeta}>
                      {med.strength && (
                        <Text style={s.suggestionMetaText}>{med.strength}</Text>
                      )}
                      {med.dosageForm && (
                        <Text style={s.suggestionMetaText}>
                          {med.dosageForm}
                        </Text>
                      )}
                    </View>
                  </View>
                  {selectedMed?.rxcui === med.rxcui && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={colors.mint}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={s.noResultsContainer}>
              <Text style={s.noResultsText}>No results found. You can add this manually.</Text>
            </View>
          )}

          {/* Manual Entry Option */}
          {showManualEntry && searchQuery.trim().length > 0 && (
            <>
              <View style={s.divider} />
              <TouchableOpacity
                style={s.manualEntryBtn}
                onPress={handleManualEntry}
                activeOpacity={0.65}
              >
                <MaterialCommunityIcons
                  name="pencil-plus"
                  size={16}
                  color={colors.mintD}
                />
                <Text style={s.manualEntryText}>
                  Use "{searchQuery}" as entered
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Helper text */}
      {selectedMed && (
        <View style={s.helperContainer}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.mintD} />
          <Text style={s.helperText}>
            Selected from RxNorm database for consistency
          </Text>
        </View>
      )}
    </View>
  );
};

export default MedicationSearch;

// ============ STYLES ============

const s = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 12,
    overflow: 'visible',
    zIndex: 9999,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e3e6eb',
    zIndex: 9999,
  },
  inputWrapperError: {
    borderColor: colors.rose,
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.body,
    fontFamily: fonts.regular,
    color: colors.navy,
    paddingVertical: 0,
  },
  inputError: {
    color: colors.rose,
  },
  loader: {
    marginHorizontal: 8,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 8,
  },
  checkIcon: {
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.rose,
  },
  errorText: {
    fontSize: fontSizes.small,
    fontFamily: fonts.regular,
    color: colors.rose,
    marginLeft: 8,
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    marginTop: 6,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.mint,
    maxHeight: 280,
    zIndex: 99999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: fontSizes.body,
    fontFamily: fonts.regular,
    color: '#7a90a0',
    marginLeft: 10,
  },
  suggestionsList: {
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  suggestionItemSelected: {
    backgroundColor: '#f0faf8',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: fontSizes.body,
    fontFamily: fonts.medium,
    color: colors.navy,
    marginBottom: 4,
  },
  suggestionNameSelected: {
    color: colors.mint,
  },
  suggestionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionMetaText: {
    fontSize: fontSizes.small,
    fontFamily: fonts.regular,
    color: '#7a90a0',
  },
  divider: {
    height: 1,
    backgroundColor: '#e3e6eb',
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  manualEntryText: {
    fontSize: fontSizes.body,
    fontFamily: fonts.regular,
    color: colors.mintD,
    marginLeft: 8,
    flex: 1,
  },
  noResultsContainer: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: fontSizes.small,
    fontFamily: fonts.regular,
    color: '#7a90a0',
    textAlign: 'center',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
    backgroundColor: '#f0faf8',
    borderRadius: 6,
  },
  helperText: {
    fontSize: fontSizes.small,
    fontFamily: fonts.regular,
    color: colors.mintD,
    marginLeft: 6,
  },
});
