# DailyDose+ — Claude Code Project Handoff

## What This Is
DailyDose+ is a medication tracking mobile app for iOS and Android.
This project was prototyped as a single HTML file and is now being converted to a
**React Native app using Expo** so it can run natively on real devices.

The original prototype (`DailyDose_Code.html`) is included in this repo as the
**source of truth** for all screens, UI logic, colors, and interactions.

---

## Your First Task (Start Here)

When Claude Code loads this project, the first thing to do is:

```
Read this CLAUDE.md, then scaffold the full React Native Expo app
based on the screens, components, and logic described here.
The prototype HTML file is the visual reference — match it exactly.
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **React Native + Expo SDK 51** | Run on iOS + Android with one codebase |
| Navigation | **React Navigation v6** (stack + bottom tabs) | Matches existing screen flow |
| State | **Zustand** | Lightweight, replaces in-memory JS vars |
| Storage | **AsyncStorage** | Persist language, trial status, medications |
| Notifications | **expo-notifications** | Dose reminders and missed-dose alerts |
| Icons | **react-native-vector-icons** (MaterialCommunityIcons) | Replaces inline SVG icons |
| Fonts | **expo-google-fonts** (DM Sans) | Matches prototype font exactly |
| Styling | **StyleSheet** + shared theme tokens | Maps 1:1 from CSS variables |
| Email sim | **expo-linking** | Deep link handling for caregiver invite |

---

## Design Tokens → theme/colors.ts

Map these CSS variables directly to a TypeScript theme file:

```typescript
export const colors = {
  mint:    '#1fa97a',
  mintL:   '#e3f7f0',
  mintM:   '#a3dfc8',
  mintD:   '#0d6e51',
  navy:    '#0f1f2e',
  muted:   '#5f7080',
  border:  '#dde8e3',
  bg:      '#f7fbf9',
  white:   '#ffffff',
  amberL:  '#fef3e7',
  amberD:  '#8a4e1a',
  amber:   '#f5a623',
  roseL:   '#fdedf2',
  rose:    '#d45d7a',
  blueL:   '#eaf2fb',
  blueD:   '#1a5c9a',
};
```

---

## Screen Map (39 screens → React Navigation routes)

### Stack: Auth
| Old Screen ID | New Screen Name | File |
|---------------|-----------------|------|
| `s1-1` | `SignUp` | `screens/auth/SignUpScreen.tsx` |
| `s1-2` | `AddMedication` | `screens/auth/AddMedicationScreen.tsx` |
| `s1-3` | `NotificationSetup` | `screens/auth/NotificationSetupScreen.tsx` |

### Bottom Tabs: Main App (Journey 1 — Parent)
| Old Screen ID | Tab | File |
|---------------|-----|------|
| `s1-home` | Home | `screens/home/HomeScreen.tsx` |
| `s1-meds` | Meds | `screens/meds/MedsScreen.tsx` |
| `s1-cal` | History | `screens/home/CalendarScreen.tsx` |
| `s1-set` | Settings | `screens/settings/SettingsScreen.tsx` |

### Stack: Caregiver Flow
| Old Screen ID | New Screen Name | File |
|---------------|-----------------|------|
| `s1-cg-invite` | `CaregiverInvite` | `screens/caregiver/InviteScreen.tsx` |
| `s1-cg-sent` | `InviteSent` | `screens/caregiver/InviteSentScreen.tsx` |
| `s1-cg-signup` | `CaregiverSignup` | `screens/caregiver/CaregiverSignupScreen.tsx` |
| `s1-cg-accounts` | `AccountSwitcher` | `screens/caregiver/AccountSwitcherScreen.tsx` |
| `s1-cg-mine` | `MyDashboard` | `screens/caregiver/MyDashboardScreen.tsx` |
| `s1-cg-shared` | `SharedDashboard` | `screens/caregiver/SharedDashboardScreen.tsx` |

### Modals (presented over any screen)
| Feature | Component | File |
|---------|-----------|------|
| Terms & Conditions | `TCModal` | `components/TCModal.tsx` |
| Trial / Subscription | `TrialModal` | `components/TrialModal.tsx` |
| Edit Medication Sheet | `EditMedSheet` | `components/EditMedSheet.tsx` |
| Edit Dose Sub-sheet | `EditDoseSheet` | `components/EditDoseSheet.tsx` |
| Delete Confirm | `DeleteConfirmModal` | `components/DeleteConfirmModal.tsx` |
| Subscription Wall | `SubWallModal` | `components/SubWallModal.tsx` |

---

## State Management → store/

### useMedStore (Zustand)
```typescript
interface MedStore {
  medications: Medication[];
  addMedication: (med: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  toggleDoseTaken: (medId: string, doseIndex: number) => void;
}

interface Medication {
  id: string;
  name: string;
  coverName?: string;         // privacy cover name
  dosage: string;
  frequency: 'daily' | 'twice-daily' | '3x-daily' | 'as-needed';
  reminderTime: string;       // "08:00"
  color: string;              // hex background color
  icon: string;               // icon name string
  isPRN: boolean;             // as-needed toggle
  isActive: boolean;
  createdAt: string;
}
```

### useSettingsStore (Zustand + AsyncStorage)
```typescript
interface SettingsStore {
  language: 'en' | 'es' | 'fr' | 'ar';
  privacyMode: boolean;       // hide real names in notifications
  trialStartDate: string | null;
  isSubscribed: boolean;
  caregivers: Caregiver[];
  setLanguage: (lang: string) => void;
  setPrivacyMode: (on: boolean) => void;
  startTrial: () => void;
  subscribe: () => void;
}
```

### useAuthStore (Zustand + AsyncStorage)
```typescript
interface AuthStore {
  user: User | null;
  accountType: 'primary' | 'caregiver';
  activeAccount: 'mine' | 'shared';
  inviteToken: string | null;
  login: (user: User) => void;
  logout: () => void;
  switchAccount: (type: 'mine' | 'shared') => void;
}
```

---

## Key Features to Implement

### 1. Terms & Conditions Modal
- Scrollable content with 6 sections
- Checkbox must be checked to enable "Accept & Continue"
- On accept → opens Trial modal
- Use `Modal` from React Native with `ScrollView` inside

### 2. Trial / Subscription Modal
- Shows after T&C accepted
- "Start 30-Day Free Trial" or "Subscribe Now — $5/month"
- Store trial start date in AsyncStorage via `useSettingsStore`
- After 30 days, show `SubWallModal` on app open
- Use `expo-in-app-purchases` for real subscription in production

### 3. Cover Name / Privacy
- Optional field on AddMedication screen
- If `privacyMode` is ON → notifications use coverName or "Your medication"
- Live preview card updates as user types (use `useState` + controlled inputs)

### 4. Icon Chooser (two tabs)
- **Medication tab**: fa-capsules, fa-pills, fa-syringe, fa-stethoscope, etc.
- **Neutral tab**: star, heart, sun, leaf, droplet, seedling, moon, snowflake, etc.
- Use `MaterialCommunityIcons` from `@expo/vector-icons`
- Selected icon highlights with mint border (med) or purple border (neutral)

### 5. Language Settings
- 4 options: English, Spanish, French, Arabic
- Persist in AsyncStorage
- Arabic → set `I18nManager.forceRTL(true)` and reload
- Use `i18next` + `react-i18next` for translations

### 6. Caregiver Invite Flow
- Generate a deep link: `dailydoseplus://invite?token=ABC123`
- Use `expo-sharing` to share the link via SMS/email/copy
- Caregiver taps link → app opens to `CaregiverSignupScreen`
- Handle with `expo-linking` in `App.tsx`

### 7. Push Notifications
- Use `expo-notifications`
- Schedule local notifications for each dose reminder time
- Missed-dose alert: if dose not logged 30 min after scheduled time
- Privacy mode: notification body uses cover name or generic text

### 8. Edit Medication Sheet
- Bottom sheet component (use `@gorhom/bottom-sheet`)
- 5 actions: Edit Icon & Color, Edit Dose, Edit Schedule, Mark PRN, Delete
- Delete → shows confirmation modal before removing

### 9. FAB (Floating Action Button)
- Bottom-right on Meds screen, above tab bar
- Opens AddMedication screen

---

## Navigation Structure

```
App.tsx
└── NavigationContainer
    ├── AuthStack (if not logged in)
    │   ├── SignUpScreen
    │   ├── AddMedicationScreen
    │   └── NotificationSetupScreen
    └── MainTabs (if logged in)
        ├── HomeTab
        │   └── HomeScreen
        ├── MedsTab
        │   ├── MedsScreen
        │   └── AddMedicationScreen (modal stack)
        ├── HistoryTab
        │   └── CalendarScreen
        └── SettingsTab
            ├── SettingsScreen
            └── CaregiverStack
                ├── InviteScreen
                ├── InviteSentScreen
                └── AccountSwitcherScreen
```

---

## Exact Commands to Run in Claude Code

```bash
# 1. Create Expo app
npx create-expo-app@latest dailydose --template blank-typescript
cd dailydose

# 2. Install all dependencies
npx expo install \
  @react-navigation/native \
  @react-navigation/stack \
  @react-navigation/bottom-tabs \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  react-native-reanimated \
  zustand \
  @react-native-async-storage/async-storage \
  expo-notifications \
  expo-linking \
  expo-sharing \
  expo-font \
  @expo-google-fonts/dm-sans \
  @expo/vector-icons \
  @gorhom/bottom-sheet \
  react-native-svg \
  i18next \
  react-i18next

# 3. Start the dev server
npx expo start

# 4. Run on device
# iOS Simulator:   press i
# Android:         press a
# Real device:     scan QR with Expo Go app
```

---

## Files in This Export

```
dailydose-export/
├── CLAUDE.md                    ← You are here (primary instructions)
├── DailyDose_Code.html          ← Original prototype (visual reference)
├── package.json                 ← Dependency list
├── app.json                     ← Expo config
├── App.tsx                      ← Entry point
├── src/
│   ├── theme/
│   │   ├── colors.ts            ← All design tokens
│   │   └── typography.ts        ← Font sizes and weights
│   ├── store/
│   │   ├── useMedStore.ts       ← Medication state
│   │   ├── useSettingsStore.ts  ← Language, privacy, trial
│   │   └── useAuthStore.ts      ← Auth and account switching
│   ├── navigation/
│   │   └── AppNavigator.tsx     ← Full navigation tree
│   ├── components/
│   │   ├── TCModal.tsx          ← Terms & Conditions modal
│   │   ├── TrialModal.tsx       ← 30-day trial / subscription modal
│   │   ├── EditMedSheet.tsx     ← Edit medication bottom sheet
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── MedRow.tsx           ← Reusable medication list row
│   │   ├── IconChooser.tsx      ← Two-tab icon picker
│   │   ├── ColorPicker.tsx      ← 6-color swatch picker
│   │   └── ProgressCard.tsx     ← Green gradient progress card
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SignUpScreen.tsx
│   │   │   ├── AddMedicationScreen.tsx
│   │   │   └── NotificationSetupScreen.tsx
│   │   ├── home/
│   │   │   ├── HomeScreen.tsx
│   │   │   └── CalendarScreen.tsx
│   │   ├── meds/
│   │   │   └── MedsScreen.tsx
│   │   ├── settings/
│   │   │   └── SettingsScreen.tsx
│   │   └── caregiver/
│   │       ├── InviteScreen.tsx
│   │       ├── InviteSentScreen.tsx
│   │       ├── CaregiverSignupScreen.tsx
│   │       ├── AccountSwitcherScreen.tsx
│   │       ├── MyDashboardScreen.tsx
│   │       └── SharedDashboardScreen.tsx
│   ├── hooks/
│   │   ├── useTrialStatus.ts    ← Check if trial expired
│   │   └── useNotifications.ts ← Schedule/cancel dose reminders
│   └── utils/
│       ├── inviteLink.ts        ← Generate + parse caregiver deep links
│       └── i18n.ts             ← Translation setup
└── locales/
    ├── en.json
    ├── es.json
    ├── fr.json
    └── ar.json
```

---

## Prototype → React Native Mapping Notes

| HTML concept | React Native equivalent |
|---|---|
| `position:absolute; inset:0` overlay | `Modal` component with `transparent` prop |
| Bottom sheet | `@gorhom/bottom-sheet` |
| `overflow-y:auto` scroll | `ScrollView` |
| CSS `display:flex` | RN default layout (Flexbox) |
| `onclick` | `onPress` on `TouchableOpacity` |
| `<input>` | `TextInput` |
| `<select>` / chips | Custom chip row with `TouchableOpacity` |
| `toggle` div | `Switch` component |
| Toast `showT()` | `react-native-toast-message` |
| CSS `var(--mint)` | `colors.mint` from theme |
| `localStorage` | `AsyncStorage` |
| `em` / `rem` units | `StyleSheet` numeric values |
| `border-radius: 14px` | `borderRadius: 14` |
| `box-shadow` | `shadow*` props (iOS) + `elevation` (Android) |
| SVG inline icons | `@expo/vector-icons` MaterialCommunityIcons |
| `DM Sans` font | `@expo-google-fonts/dm-sans` |

---

## Priority Build Order

Build in this order — each step is shippable:

1. **Theme + Navigation skeleton** — colors, fonts, empty screens, tab bar
2. **SignUp → AddMedication → NotificationSetup** — auth flow with T&C and Trial modals
3. **Home screen** — progress card, upcoming doses, week streak
4. **Meds screen** — medication list, edit sheet, FAB, delete confirm
5. **Settings screen** — language switcher, privacy toggle, notifications
6. **Caregiver flow** — invite, signup, account switcher, shared dashboard
7. **Push notifications** — local scheduling via expo-notifications
8. **Trial expiry wall** — check AsyncStorage on app open
9. **Deep links** — caregiver invite link handling
10. **Polish** — animations, haptics, accessibility

---

## iOS / Android Specific Notes

### iOS
- Add to `app.json`: `"infoPlist": { "NSUserNotificationsUsageDescription": "DailyDose+ uses notifications to remind you to take your medications." }`
- Use `expo-haptics` for button feedback (iOS haptic engine)
- Bottom sheets look native with `@gorhom/bottom-sheet` + `react-native-reanimated`

### Android
- Add to `app.json`: `"permissions": ["RECEIVE_BOOT_COMPLETED", "VIBRATE", "POST_NOTIFICATIONS"]`
- Use `elevation` prop for shadows (not `box-shadow`)
- RTL (Arabic) works with `I18nManager.forceRTL(true)` — requires app reload

---

## Color Reference (quick copy)

```
Primary Green:  #1fa97a    Light Green BG: #e3f7f0
Dark Green:     #0d6e51    Mid Green:      #a3dfc8
Navy (text):    #0f1f2e    Muted text:     #5f7080
Border:         #dde8e3    Background:     #f7fbf9
Rose/danger:    #d45d7a    Rose light:     #fdedf2
Amber:          #f5a623    Amber light:    #fef3e7
Blue light:     #eaf2fb    Blue dark:      #1a5c9a
```
