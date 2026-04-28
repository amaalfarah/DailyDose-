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

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuthStore();

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

  function cancelEdit() {
    setEditing(null);
    setDraftUsername(user?.name ?? '');
    setDraftEmail(user?.email ?? '');
    setDraftDob(user?.dob ?? '');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
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
    updateUser({ email: trimmed });
    setEditing(null);
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
            <Text style={s.avatarText}>
              {(user?.name ?? 'U').slice(0, 2).toUpperCase()}
            </Text>
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
          onEdit={() => { setDraftEmail(user?.email ?? ''); setEditing('email'); }}
          onCancel={cancelEdit}
          onSave={saveEmail}
        >
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

      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label, icon, isEditing, displayValue, editLabel = 'Edit',
  onEdit, onCancel, onSave, children,
}: {
  label: string;
  icon: string;
  isEditing: boolean;
  displayValue: string;
  editLabel?: string;
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
          <Text style={s.fieldLabel}>{label}</Text>
          {!isEditing && <Text style={s.fieldValue}>{displayValue}</Text>}
        </View>
      </View>
      {isEditing ? (
        <View style={s.editArea}>
          {children}
          <View style={s.editActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={onSave}>
              <Text style={s.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 10,
    borderWidth: 2, borderColor: colors.mintM,
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
  fieldLabel: {
    fontSize: fontSizes.xs, fontFamily: fonts.bold, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
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
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { marginLeft: 8 },

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
