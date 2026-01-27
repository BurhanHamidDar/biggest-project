import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, GraduationCap, IndianRupee, User } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ExamsListScreen from '../screens/Marks/ExamsListScreen';
import FeesScreen from '../screens/FeesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../theme';
import { Platform } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
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
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Schedule"
                component={ScheduleScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Marks"
                component={ExamsListScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Fees"
                component={FeesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <IndianRupee color={color} size={size} />
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
