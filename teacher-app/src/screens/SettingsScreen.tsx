import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { Lock, LogOut, Bell, ClipboardList, CheckSquare, FileText, BookOpen, Banknote, Palette, Globe, Info, Shield, Key, MessageSquare } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import ChangePasswordModal from '../components/ChangePasswordModal';
import * as Application from 'expo-application';
import { theme } from '../theme';

export default function SettingsScreen({ navigation }: any) {
    const { profile, signOut } = useAuth();
    const { showAlert } = useAlert();
    const [changePassVisible, setChangePassVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    // Notification Preferences
    const [preferences, setPreferences] = useState({
        notification_homework: true,
        notification_attendance: true,
        notification_notices: true,
        notification_marks: true,
        notification_fee: true,
    });

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            if (!profile?.id) return;
            const { data, error } = await supabase
                .from('profiles')
                .select('notification_homework, notification_attendance, notification_notices, notification_marks, notification_fee')
                .eq('id', profile.id)
                .single();

            if (error) {
                console.error('Error fetching preferences:', error);
            } else if (data) {
                setPreferences(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const togglePreference = async (key: string, value: boolean) => {
        // Optimistic update
        setPreferences(prev => ({ ...prev, [key]: value }));

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ [key]: value })
                .eq('id', profile?.id);

            if (error) {
                throw error;
            }
        } catch (err: any) {
            console.error('Error updating preference:', err);
            showAlert({ type: 'error', title: 'Update Failed', message: 'Could not save setting.' });
            // Revert
            setPreferences(prev => ({ ...prev, [key]: !value }));
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: signOut }
            ]
        );
    };

    const handleChangePassword = () => {
        setChangePassVisible(true);
    };

    const ToggleRow = ({ label, icon: Icon, value, onToggle }: any) => (
        <View style={styles.toggleRow}>
            <View style={styles.toggleLabelContainer}>
                <View style={styles.iconBox}>
                    <Icon size={18} color={theme.colors.primary} />
                </View>
                <Text style={styles.toggleLabel}>{label}</Text>
            </View>
            <Switch
                trackColor={{ false: "#e2e8f0", true: theme.colors.primary }}
                thumbColor={"#fff"}
                ios_backgroundColor="#e2e8f0"
                onValueChange={onToggle}
                value={value}
            />
        </View>
    );

    const SectionHeader = ({ title, icon: Icon }: any) => (
        <View style={styles.sectionHeader}>
            <Icon size={20} color={theme.colors.text ? theme.colors.text.secondary : '#64748b'} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 40 }} />
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. Account & Security */}
                <View style={styles.card}>
                    <SectionHeader title="Account & Security" icon={Shield} />

                    <TouchableOpacity style={styles.actionRow} onPress={handleChangePassword}>
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
                                <Key size={18} color="#ea580c" />
                            </View>
                            <Text style={styles.actionLabel}>Change Password</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
                        <View style={styles.actionLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                                <LogOut size={18} color="#ef4444" />
                            </View>
                            <Text style={[styles.actionLabel, { color: '#ef4444' }]}>Log Out</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* 2. Notifications */}
                <View style={styles.card}>
                    <SectionHeader title="Notifications" icon={Bell} />

                    {loading ? (
                        <ActivityIndicator style={{ padding: 20 }} />
                    ) : (
                        <>
                            <ToggleRow
                                label="Homework Updates"
                                icon={ClipboardList}
                                value={preferences.notification_homework}
                                onToggle={(v: boolean) => togglePreference('notification_homework', v)}
                            />
                            <ToggleRow
                                label="Attendance Alerts"
                                icon={CheckSquare}
                                value={preferences.notification_attendance}
                                onToggle={(v: boolean) => togglePreference('notification_attendance', v)}
                            />
                            <ToggleRow
                                label="School Notices"
                                icon={Bell}
                                value={preferences.notification_notices}
                                onToggle={(v: boolean) => togglePreference('notification_notices', v)}
                            />
                            <ToggleRow
                                label="Exam Marks"
                                icon={FileText}
                                value={preferences.notification_marks}
                                onToggle={(v: boolean) => togglePreference('notification_marks', v)}
                            />
                            <ToggleRow
                                label="Fee Status"
                                icon={Banknote}
                                value={preferences.notification_fee}
                                onToggle={(v: boolean) => togglePreference('notification_fee', v)}
                            />
                        </>
                    )}
                </View>

                {/* 3. App Preferences */}
                <View style={styles.card}>
                    <SectionHeader title="App Preferences" icon={Palette} />
                    <View style={styles.placeholderRow}>
                        <Text style={styles.placeholderText}>Theme customization coming soon</Text>
                    </View>
                    <View style={styles.placeholderRow}>
                        <Text style={styles.placeholderText}>Language support coming soon</Text>
                    </View>
                </View>

                {/* 4. About App */}
                <View style={styles.card}>
                    <SectionHeader title="About" icon={Info} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>App Name</Text>
                        <Text style={styles.infoValue}>Ayesha Ali Academy Teacher App</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Version</Text>
                        <Text style={styles.infoValue}>{Application.nativeApplicationVersion || '1.0.0'} ({Application.nativeBuildVersion || '1'})</Text>
                    </View>
                </View>

                {/* 5. System Status */}
                <View style={styles.statusContainer}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>System Online</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <ChangePasswordModal
                visible={changePassVisible}
                onClose={() => setChangePassVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: { backgroundColor: theme.colors.primary, paddingBottom: 16 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

    scrollContent: { padding: 20, gap: 20 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#64748b' }, // Slate 500

    iconBox: {
        width: 32, height: 32, borderRadius: 8, backgroundColor: '#e0e7ff',
        justifyContent: 'center', alignItems: 'center'
    },

    // Toggles
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    toggleLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggleLabel: { fontSize: 15, color: '#1e293b', fontWeight: '500' },

    // Actions (Account)
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionLabel: { fontSize: 16, color: '#1e293b', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },

    // Info
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    infoLabel: { color: '#64748b', fontSize: 15 },
    infoValue: { color: '#1e293b', fontWeight: 'bold', fontSize: 15 },

    // Placeholder
    placeholderRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    placeholderText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 14 },

    // System Status
    statusContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }, // Green 500
    statusText: { color: '#64748b', fontSize: 13, fontWeight: '500' }
});
