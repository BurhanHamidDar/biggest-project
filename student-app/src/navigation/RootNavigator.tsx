import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';
import HomeworkListScreen from '../screens/Homework/HomeworkListScreen';
import HomeworkDetailScreen from '../screens/Homework/HomeworkDetailScreen';
import ClassTestsScreen from '../screens/Marks/ClassTestsScreen';
import ExamsListScreen from '../screens/Marks/ExamsListScreen';
import ExamResultScreen from '../screens/Marks/ExamResultScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import NoticesListScreen from '../screens/NoticesListScreen';
import NoticeDetailScreen from '../screens/NoticeDetailScreen';
import RemarksListScreen from '../screens/RemarksListScreen';
import RemarkDetailScreen from '../screens/RemarkDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import AccountDisabledScreen from '../screens/AccountDisabledScreen';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import SplashScreen from '../components/SplashScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
    const { user, loading, maintenanceMode, checkSystemSettings } = useAuth();
    // ... (rest unchanged)
    if (loading) {
        return <SplashScreen />;
    }

    if (maintenanceMode?.blocked) {
        if (maintenanceMode.type === 'disabled') {
            return <AccountDisabledScreen reason={maintenanceMode.message} />;
        }
        return <MaintenanceScreen message={maintenanceMode.message} onRetry={checkSystemSettings} />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="MainTabs" component={TabNavigator} />
                        <Stack.Screen name="HomeworkList" component={HomeworkListScreen} />
                        <Stack.Screen name="HomeworkDetail" component={HomeworkDetailScreen} />
                        <Stack.Screen name="ClassTests" component={ClassTestsScreen} />
                        <Stack.Screen name="ExamsList" component={ExamsListScreen} />
                        <Stack.Screen name="ExamResult" component={ExamResultScreen} />
                        <Stack.Screen name="Attendance" component={AttendanceScreen} />
                        <Stack.Screen name="NoticesList" component={NoticesListScreen} />
                        <Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} />
                        <Stack.Screen name="RemarksList" component={RemarksListScreen} />
                        <Stack.Screen name="RemarkDetail" component={RemarkDetailScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
