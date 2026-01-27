import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import RootNavigator from './src/navigation/RootNavigator';

// Disable native screens to fix "String cannot be cast to Boolean" crash in Expo Go
enableScreens(false);

export default function App() {
  return (
    <SafeAreaProvider>
      <AlertProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#111827" />
          <RootNavigator />
        </AuthProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}
