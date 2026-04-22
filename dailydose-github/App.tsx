import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import Toast from 'react-native-toast-message';

import AppNavigator from './src/navigation/AppNavigator';
import TrialModal from './src/components/TrialModal';
import SubWallModal from './src/components/SubWallModal';
import { useSettingsStore } from './src/store/useSettingsStore';
import { linking } from './src/utils/inviteLink';

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    /* Pin the app to viewport height so flex:1 children get a bounded size.
       Without this, React Native Web ScrollViews expand to content height
       and have nothing to scroll within. */
    html, body { height: 100vh !important; overflow: hidden; }
    #root {
      height: 100vh !important;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Show scrollbars — React Native Web hides them by default. */
    ::-webkit-scrollbar { display: block !important; width: 12px; height: 12px; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.45); border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
    ::-webkit-scrollbar-track { background: rgba(0,0,0,0.08); border-radius: 8px; }
    * { scrollbar-width: auto !important; scrollbar-color: rgba(0,0,0,0.45) rgba(0,0,0,0.08) !important; }
    * { -webkit-overflow-scrolling: touch; }
  `;
  document.head.appendChild(style);
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const { isSubscribed, trialExpired } = useSettingsStore();

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
    <GestureHandlerRootView style={{ flex: 1, ...(Platform.OS === 'web' && { height: '100vh' }) }}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <StatusBar style="dark" />
          <AppNavigator />

          {/* Global modals — rendered on top of everything */}
          <TrialModal />
          {trialExpired && !isSubscribed && <SubWallModal />}

          <Toast />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
