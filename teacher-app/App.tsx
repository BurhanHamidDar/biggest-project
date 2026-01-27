import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ActivityIndicator, View } from 'react-native';
import { AlertProvider } from './src/context/AlertContext';
import {
    useFonts,
    Oswald_400Regular,
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
} from '@expo-google-fonts/oswald';
import { setGlobalTypography } from './src/utils/typography';

export default function App() {
    const [fontsLoaded] = useFonts({
        'Oswald': Oswald_500Medium,
        'Oswald-Bold': Oswald_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded) {
            setGlobalTypography();
        }
    }, [fontsLoaded]);

    console.log("App Starting...");

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1e293b" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="light" backgroundColor="#1e293b" />
            <AlertProvider>
                <AuthProvider>
                    <RootNavigator />
                </AuthProvider>
            </AlertProvider>
        </SafeAreaProvider>
    );
}
