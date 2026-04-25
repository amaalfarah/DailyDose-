// navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';

// Auth screens
import SignUpScreen from '../screens/auth/SignUpScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import AddMedicationScreen from '../screens/auth/AddMedicationScreen';
import NotificationSetupScreen from '../screens/auth/NotificationSetupScreen';

// Main app screens
import HomeScreen from '../screens/home/HomeScreen';
import CalendarScreen from '../screens/home/CalendarScreen';
import MedsScreen from '../screens/meds/MedsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Caregiver screens
import InviteScreen from '../screens/caregiver/InviteScreen';
import InviteSentScreen from '../screens/caregiver/InviteSentScreen';
import CaregiverSignupScreen from '../screens/caregiver/CaregiverSignupScreen';
import AccountSwitcherScreen from '../screens/caregiver/AccountSwitcherScreen';
import MyDashboardScreen from '../screens/caregiver/MyDashboardScreen';
import SharedDashboardScreen from '../screens/caregiver/SharedDashboardScreen';

export type AuthStackParams = {
  SignUp: undefined;
  Login: undefined;
  AddMedication: undefined;
  NotificationSetup: undefined;
};

export type MainTabParams = {
  Home: undefined;
  Meds: undefined;
  History: undefined;
  Settings: undefined;
};

export type CaregiverStackParams = {
  AccountSwitcher: undefined;
  MyDashboard: undefined;
  SharedDashboard: undefined;
  Invite: undefined;
  InviteSent: { caregiverName: string; caregiverEmail: string };
  CaregiverSignup: { token: string };
};

export type SettingsStackParams = {
  SettingsMain: undefined;
  Invite: undefined;
  InviteSent: { caregiverName: string; caregiverEmail: string };
  AccountSwitcher: undefined;
  MyDashboard: undefined;
  SharedDashboard: undefined;
  CaregiverSignup: { token: string };
};

const AuthStack = createStackNavigator<AuthStackParams>();
const Tab = createBottomTabNavigator<MainTabParams>();
const CaregiverStack = createStackNavigator<CaregiverStackParams>();
const SettingsStack = createStackNavigator<SettingsStackParams>();

function CaregiverNavigator() {
  return (
    <CaregiverStack.Navigator screenOptions={{ headerShown: false }}>
      <CaregiverStack.Screen name="AccountSwitcher" component={AccountSwitcherScreen} />
      <CaregiverStack.Screen name="MyDashboard" component={MyDashboardScreen} />
      <CaregiverStack.Screen name="SharedDashboard" component={SharedDashboardScreen} />
      <CaregiverStack.Screen name="Invite" component={InviteScreen} />
      <CaregiverStack.Screen name="InviteSent" component={InviteSentScreen} />
      <CaregiverStack.Screen name="CaregiverSignup" component={CaregiverSignupScreen} />
    </CaregiverStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="Invite" component={InviteScreen} />
      <SettingsStack.Screen name="InviteSent" component={InviteSentScreen} />
      <SettingsStack.Screen name="AccountSwitcher" component={AccountSwitcherScreen} />
      <SettingsStack.Screen name="MyDashboard" component={MyDashboardScreen} />
      <SettingsStack.Screen name="SharedDashboard" component={SharedDashboardScreen} />
      <SettingsStack.Screen name="CaregiverSignup" component={CaregiverSignupScreen} />
    </SettingsStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1.5,
          paddingBottom: 6,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: '#aab8c0',
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: 'DMSans_700Bold',
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Home: 'home-variant',
            Meds: 'pill',
            History: 'calendar-month',
            Settings: 'cog',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name] as any}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Meds" component={MedsScreen} />
      <Tab.Screen name="History" component={CalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, hasAcceptedTerms, hasStartedTrial } = useAuthStore();

  // Not logged in → show auth flow
  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="SignUp" component={SignUpScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="AddMedication" component={AddMedicationScreen} />
        <AuthStack.Screen name="NotificationSetup" component={NotificationSetupScreen} />
      </AuthStack.Navigator>
    );
  }

  // Logged in → main app
  return <MainTabs />;
}
