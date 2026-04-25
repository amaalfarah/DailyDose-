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
    html {
      height: 100%;
      background: #1fa97a;
    }
    body {
      margin: 0;
      height: 100%;
      overflow: hidden;
      background: linear-gradient(160deg, #0d6e51 0%, #1fa97a 50%, #0f1f2e 100%);
      background-attachment: fixed;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    #root {
      height: 100vh;
      width: 100%;
      max-width: 430px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #f7fbf9;
      position: relative;
      box-shadow: 0 0 80px rgba(0,0,0,0.4);
    }
    ::-webkit-scrollbar { display: block !important; width: 6px; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.3); border-radius: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    * { -webkit-overflow-scrolling: touch; }
  `;
  document.head.appendChild(style);
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const { isSubscribed, trialExpired, checkTrialExpiry } = useSettingsStore();

  useEffect(() => {
    checkTrialExpiry();
  }, []);

  useEffect(() => {
    Font.loadAsync({
      DMSans_400Regular,
      DMSans_500Medium,
      DMSans_700Bold,
    })
      .catch(() => {})
      .finally(() => setFontsLoaded(true));
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
