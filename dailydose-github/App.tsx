import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import Toast from 'react-native-toast-message';

import AppNavigator from './src/navigation/AppNavigator';
import TCModal from './src/components/TCModal';
import TrialModal from './src/components/TrialModal';
import SubWallModal from './src/components/SubWallModal';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useAuthStore } from './src/store/useAuthStore';
import { linking } from './src/utils/inviteLink';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const { isSubscribed, trialStartDate, trialExpired } = useSettingsStore();
  const { hasAcceptedTerms } = useAuthStore();

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_700Bold,
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <StatusBar style="dark" />
          <AppNavigator />

          {/* Global modals — rendered on top of everything */}
          <TCModal />
          <TrialModal />
          {trialExpired && !isSubscribed && <SubWallModal />}

          <Toast />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
