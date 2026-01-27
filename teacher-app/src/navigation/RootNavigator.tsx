import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, Platform } from 'react-native';
import { Home, ListTodo, Inbox, User, Settings } from 'lucide-react-native';
import { AlertProvider } from '../context/AlertContext';
import { theme } from '../theme';
import SplashScreen from '../components/SplashScreen';

// Placeholder Screens (Will be moved later)
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AttendanceScreen from '../screens/AttendanceScreen'; // Added
import HomeworkScreen from '../screens/HomeworkScreen'; // Added
import ClassMarksScreen from '../screens/ClassMarksScreen';
import ExamMarksScreen from '../screens/ExamMarksScreen';
import TimetableScreen from '../screens/TimetableScreen';
import MarkFeesScreen from '../screens/MarkFeesScreen';
import StudentsScreen from '../screens/StudentsScreen'; // Added
import StudentDetailScreen from '../screens/StudentDetailScreen'; // Added
import NoticesScreen from '../screens/NoticesScreen';
import TasksScreen from '../screens/TasksScreen';
import InboxScreen from '../screens/InboxScreen';
import ProfileScreen from '../screens/ProfileScreen';


import HomeworkDetailScreen from '../screens/HomeworkDetailScreen';
import HomeworkManagementScreen from '../screens/HomeworkManagementScreen';
import AttendanceManagementScreen from '../screens/AttendanceManagementScreen';
import ClassTestsManagementScreen from '../screens/ClassTestsManagementScreen';

import AccountDisabledScreen from '../screens/AccountDisabledScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    height: Platform.OS === 'ios' ? 88 : 60,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    paddingTop: 8
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.text.secondary,
                tabBarLabelStyle: {
                    fontWeight: '600',
                    fontSize: 10
                }
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Tasks"
                component={TasksScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <ListTodo color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Inbox"
                component={InboxScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
}

import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import * as Linking from 'expo-linking';

// ... imports ...

const linking = {
    prefixes: [Linking.createURL('/'), 'teacherapp://'],
    config: {
        screens: {
            ResetPassword: 'reset-password',
            Login: 'login',
        },
    },
};

export default function RootNavigator() {
    const { user, profile, loading, maintenanceMode, checkSystemSettings } = useAuth();

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
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user && profile ? (
                    <>
                        {/* Authenticated Stack */}
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Attendance" component={AttendanceScreen} />
                        <Stack.Screen name="Homework" component={HomeworkScreen} />
                        <Stack.Screen name="ClassMarks" component={ClassMarksScreen} />
                        <Stack.Screen name="ExamMarks" component={ExamMarksScreen} />
                        <Stack.Screen name="Timetable" component={TimetableScreen} />
                        <Stack.Screen name="MarkFees" component={MarkFeesScreen} />
                        <Stack.Screen name="Students" component={StudentsScreen} />
                        <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
                        <Stack.Screen name="Notices" component={NoticesScreen} />

                        {/* Tasks Tab Ecosystem */}
                        <Stack.Screen name="HomeworkManagement" component={HomeworkManagementScreen} />
                        <Stack.Screen name="HomeworkDetail" component={HomeworkDetailScreen} />
                        <Stack.Screen name="AttendanceManagement" component={AttendanceManagementScreen} />
                        <Stack.Screen name="ClassTestsManagement" component={ClassTestsManagementScreen} />
                    </>
                ) : (
                    /* Public Stack */
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
