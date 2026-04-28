import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { useAuthStore } from '../../store/useAuthStore';

type EditField = 'username' | 'email' | 'dob' | 'password' | null;

function formatDob(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function validateDob(v: string): string {
  if (!v) return 'Date of birth is required';
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return 'Enter date as MM/DD/YYYY';
  const [mm, dd, yyyy] = v.split('/').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  if (
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd ||
    date.getFullYear() !== yyyy
  ) return 'Enter a valid date';
  const today = new Date();
  if (date > today) return 'Date cannot be in the future';
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  if (age < 13) return 'Must be at least 13 years old';
  return '';
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUser, setPendingVerificationCode, pendingVerificationCode } = useAuthStore();

  const [editing, setEditing] = useState<EditField>(null);

  const [draftUsername, setDraftUsername] = useState(user?.name ?? '');
  const [draftEmail, setDraftEmail]       = useState(user?.email ?? '');
  const [draftDob, setDraftDob]           = useState(user?.dob ?? '');
  const [currentPw, setCurrentPw]         = useState('');
  const [newPw, setNewPw]                 = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Email verification step
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [enteredCode, setEnteredCode]   = useState('');
  const [codeError, setCodeError]       = useState('');

  function cancelEdit() {
    setEditing(null);
    setDraftUsername(user?.name ?? '');
    setDraftEmail(user?.email ?? '');
    setDraftDob(user?.dob ?? '');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setAwaitingVerification(false);
    setEnteredCode(''); setCodeError('');
    setPendingVerificationCode(null);
  }

  function saveUsername() {
    const trimmed = draftUsername.trim();
    if (!trimmed || trimmed.length < 3) {
      Alert.alert('Invalid', 'Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      Alert.alert('Invalid', 'Only letters, numbers, _ and - allowed.');
      return;
    }
    updateUser({ name: trimmed });
    setEditing(null);
  }

  function saveEmail() {
    const trimmed = draftEmail.trim();
    if (!/^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
      Alert.alert('Invalid', 'Enter a valid email address.');
      return;
    }
    const code = generateCode();
    setPendingVerificationCode(code);
    updateUser({ email: trimmed, emailVerified: false });
    setAwaitingVerification(true);
    Alert.alert(
      'Verification Email Sent',
      `A 6-digit code has been sent to ${trimmed}.\n\nYour code: ${code}`,
      [{ text: 'OK' }]
    );
  }

  function submitVerificationCode() {
    if (enteredCode.trim() === pendingVerificationCode) {
      updateUser({ emailVerified: true });
      setPendingVerificationCode(null);
      setAwaitingVerification(false);
      setEnteredCode(''); setCodeError('');
      setEditing(null);
      Alert.alert('Verified', 'Your email has been verified.');
    } else {
      setCodeError('Incorrect code. Please try again.');
    }
  }

  function saveDob() {
    const err = validateDob(draftDob);
    if (err) { Alert.alert('Invalid', err); return; }
    updateUser({ dob: draftDob });
    setEditing(null);
  }

  function savePassword() {
    if (!currentPw) { Alert.alert('Required', 'Enter your current password.'); return; }
    if (newPw.length < 8) { Alert.alert('Too short', 'New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Mismatch', 'New passwords do not match.'); return; }
    Alert.alert('Updated', 'Your password has been changed.');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setEditing(null);
  }

  const initials =
    (user?.name ?? '').split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.navy} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.avatarName}>{user?.name ?? ''}</Text>
        </View>

        {/* Username */}
        <Field
          label="Username"
          icon="account-outline"
          isEditing={editing === 'username'}
          displayValue={user?.name ?? '—'}
          onEdit={() => { setDraftUsername(user?.name ?? ''); setEditing('username'); }}
          onCancel={cancelEdit}
          onSave={saveUsername}
        >
          <TextInput
            style={s.input}
            value={draftUsername}
            onChangeText={setDraftUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            placeholder="Enter username"
            placeholderTextColor="#b0bec5"
          />
        </Field>

        {/* Email */}
        <Field
          label="Email"
          icon="email-outline"
          isEditing={editing === 'email'}
          displayValue={user?.email || '—'}
          badge={
            user?.email
              ? user.emailVerified
                ? { text: 'Verified', color: colors.mint, bg: colors.mintL }
                : { text: 'Unverified', color: colors.amber, bg: colors.amberL }
              : undefined
          }
          onEdit={() => {
            setDraftEmail(user?.email ?? '');
            setAwaitingVerification(false);
            setEnteredCode(''); setCodeError('');
            setEditing('email');
          }}
          onCancel={cancelEdit}
          onSave={saveEmail}
          saveLabel={awaitingVerification ? undefined : 'Send Code'}
        >
          {!awaitingVerification ? (
            <TextInput
              style={s.input}
              value={draftEmail}
              onChangeText={setDraftEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Enter email"
              placeholderTextColor="#b0bec5"
            />
          ) : (
            <View>
              <Text style={s.verifyHint}>
                Enter the 6-digit code sent to{' '}
                <Text style={{ color: colors.navy, fontFamily: fonts.medium }}>{user?.email}</Text>
              </Text>
              <TextInput
                style={[s.input, codeError ? s.inputError : null]}
                value={enteredCode}
                onChangeText={(v) => { setEnteredCode(v); setCodeError(''); }}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor="#b0bec5"
              />
              {codeError ? <Text style={s.codeError}>{codeError}</Text> : null}
              <View style={s.editActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={cancelEdit}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={submitVerificationCode}>
                  <Text style={s.saveText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Field>

        {/* Password */}
        <Field
          label="Password"
          icon="lock-outline"
          isEditing={editing === 'password'}
          displayValue="••••••••"
          editLabel="Change"
          onEdit={() => setEditing('password')}
          onCancel={cancelEdit}
          onSave={savePassword}
        >
          <View style={s.pwRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={currentPw}
              onChangeText={setCurrentPw}
              secureTextEntry={!showCurrentPw}
              placeholder="Current password"
              placeholderTextColor="#b0bec5"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrentPw(p => !p)} style={s.eyeBtn}>
              <MaterialCommunityIcons
                name={showCurrentPw ? 'eye-off-outline' : 'eye-outline'}
                size={18} color={colors.muted}
              />
            </TouchableOpacity>
          </View>
          <View style={s.pwRow}>
            <TextInput
              style={[s.input, { flex: 1, marginTop: 8 }]}
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry={!showNewPw}
              placeholder="New password"
              placeholderTextColor="#b0bec5"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPw(p => !p)} style={[s.eyeBtn, { marginTop: 8 }]}>
              <MaterialCommunityIcons
                name={showNewPw ? 'eye-off-outline' : 'eye-outline'}
                size={18} color={colors.muted}
              />
            </TouchableOpacity>
          </View>
          <View style={s.pwRow}>
            <TextInput
              style={[s.input, { flex: 1, marginTop: 8 }]}
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry={!showConfirmPw}
              placeholder="Confirm new password"
              placeholderTextColor="#b0bec5"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPw(p => !p)} style={[s.eyeBtn, { marginTop: 8 }]}>
              <MaterialCommunityIcons
                name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'}
                size={18} color={colors.muted}
              />
            </TouchableOpacity>
          </View>
        </Field>

        {/* Date of Birth */}
        <Field
          label="Date of Birth"
          icon="calendar-outline"
          isEditing={editing === 'dob'}
          displayValue={user?.dob || '—'}
          onEdit={() => { setDraftDob(user?.dob ?? ''); setEditing('dob'); }}
          onCancel={cancelEdit}
          onSave={saveDob}
        >
          <TextInput
            style={s.input}
            value={draftDob}
            onChangeText={(t) => setDraftDob(formatDob(t))}
            keyboardType="numeric"
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#b0bec5"
            maxLength={10}
          />
        </Field>

      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label, icon, isEditing, displayValue, editLabel = 'Edit', saveLabel = 'Save',
  badge, onEdit, onCancel, onSave, children,
}: {
  label: string;
  icon: string;
  isEditing: boolean;
  displayValue: string;
  editLabel?: string;
  saveLabel?: string;
  badge?: { text: string; color: string; bg: string };
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.cardIcon}>
          <MaterialCommunityIcons name={icon as any} size={18} color={colors.mint} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.labelRow}>
            <Text style={s.fieldLabel}>{label}</Text>
            {badge && (
              <View style={[s.badge, { backgroundColor: badge.bg }]}>
                <Text style={[s.badgeText, { color: badge.color }]}>{badge.text}</Text>
              </View>
            )}
          </View>
          {!isEditing && <Text style={s.fieldValue}>{displayValue}</Text>}
        </View>
      </View>
      {isEditing ? (
        <View style={s.editArea}>
          {children}
          {/* Password and email-verify fields manage their own action rows */}
          {label !== 'Email' && (
            <View style={s.editActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={onSave}>
                <Text style={s.saveText}>{saveLabel}</Text>
              </TouchableOpacity>
            </View>
          )}
          {label === 'Email' && saveLabel === 'Send Code' && (
            <View style={s.editActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={onSave}>
                <Text style={s.saveText}>Send Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.75}>
          <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.mint} />
          <Text style={s.editBtnText}>{editLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.white, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.navy },

  avatarWrap: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.mintL, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, borderWidth: 2, borderColor: colors.mintM,
  },
  avatarText: { fontSize: 26, fontFamily: fonts.bold, color: colors.mintD },
  avatarName: { fontSize: fontSizes.lg, fontFamily: fonts.bold, color: colors.navy },

  card: {
    backgroundColor: colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.border,
    marginBottom: 12, padding: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  cardIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.mintL, alignItems: 'center', justifyContent: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  fieldLabel: {
    fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  badge: {
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeText: { fontSize: fontSizes.xs - 1, fontFamily: fonts.bold },
  fieldValue: { fontSize: fontSizes.base + 1, fontFamily: fonts.medium, color: colors.navy },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.mintL, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.mintM,
  },
  editBtnText: { fontSize: fontSizes.xs + 1, fontFamily: fonts.bold, color: colors.mint },

  editArea: { marginTop: 4 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1.5,
    borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: fontSizes.base, fontFamily: fonts.regular, color: colors.navy,
  },
  inputError: { borderColor: colors.rose },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { marginLeft: 8 },

  verifyHint: {
    fontSize: fontSizes.xs + 1, color: colors.muted,
    marginBottom: 8, lineHeight: 16,
  },
  codeError: { fontSize: fontSizes.xs, color: colors.rose, marginTop: 4, marginLeft: 2 },

  editActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  cancelText: { fontSize: fontSizes.base, fontFamily: fonts.medium, color: colors.muted },
  saveBtn: {
    flex: 1, backgroundColor: colors.mint,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  saveText: { fontSize: fontSizes.base, fontFamily: fonts.bold, color: '#fff' },
});
