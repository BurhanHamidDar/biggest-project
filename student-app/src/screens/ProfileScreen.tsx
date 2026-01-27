import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Mail, Phone, MapPin, User, Calendar,
    Bus, Key, LogOut, Shield, School,
    Users, Briefcase, Settings
} from 'lucide-react-native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function ProfileScreen({ navigation }: any) {
    const { user, profile, studentData, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [extraInfo, setExtraInfo] = useState({
        className: 'Loading...',
        sectionName: '',
        busNumber: 'Not Assigned',
        transportStatus: 'No'
    });

    useEffect(() => {
        if (studentData) {
            fetchExtraDetails();
        }
    }, [studentData]);

    const fetchExtraDetails = async () => {
        try {
            const updates: any = {};

            // 1. Fetch Class & Section
            if (studentData.class_id) {
                const { data: classData } = await supabase.from('classes').select('name').eq('id', studentData.class_id).single();
                if (classData) updates.className = classData.name;
            }

            if (studentData.section_id) {
                const { data: sectionData } = await supabase.from('sections').select('name').eq('id', studentData.section_id).single();
                if (sectionData) updates.sectionName = sectionData.name;
            }

            // 2. Fetch Bus Info
            if (studentData.bus_id) {
                updates.transportStatus = 'Yes';
                const { data: busData } = await supabase.from('buses').select('bus_number').eq('id', studentData.bus_id).single();
                if (busData) updates.busNumber = busData.bus_number;
            } else {
                updates.transportStatus = 'No';
                updates.busNumber = 'N/A';
            }

            setExtraInfo(prev => ({ ...prev, ...updates }));
        } catch (error) {
            console.error('Error fetching profile details:', error);
        } finally {
            setLoading(false);
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

    const handleChangePassword = async () => {
        Alert.alert("Change Password", "To change your password, please contact the school administration or use the 'Forgot Password' link on the login screen.");
        // Future: Implement actual OTP flow if backend supports student-initiated reset
    };

    const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | null }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconBox}>
                <Icon size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
            </View>
        </View>
    );

    if (!studentData || loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <LinearGradient
                    colors={[theme.colors.primary, '#1e1b4b']} // Navy to darker navy
                    style={styles.header}
                >
                    <SafeAreaView edges={['top']} style={styles.headerContent}>
                        {/* Settings Button */}
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <Settings size={24} color="#fff" />
                        </TouchableOpacity>

                        <View style={styles.profileImageContainer}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.profileImage} />
                            ) : (
                                <View style={[styles.profileImage, styles.placeholderImage]}>
                                    <Text style={styles.initials}>
                                        {profile?.full_name?.charAt(0) || 'S'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.verifiedBadge}>
                                <Shield size={12} color="#fff" fill={theme.colors.primary} />
                            </View>
                        </View>

                        <Text style={styles.studentName}>{profile?.full_name || 'Student Name'}</Text>
                        <Text style={styles.classInfo}>
                            {extraInfo.className}
                            {extraInfo.sectionName ? (' - ' + extraInfo.sectionName) : ''}
                        </Text>
                        <View style={styles.admissionBadge}>
                            <Text style={styles.admissionText}>Adm No: {studentData.admission_no}</Text>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Info Cards */}
                <View style={styles.cardsContainer}>

                    {/* Personal Information */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Personal Information</Text>
                        <InfoRow icon={User} label="Gender" value={studentData.gender ? studentData.gender.charAt(0).toUpperCase() + studentData.gender.slice(1) : null} />
                        <InfoRow
                            icon={Calendar}
                            label="Date of Birth"
                            value={studentData.dob ? format(new Date(studentData.dob), 'dd MMM yyyy') : null}
                        />
                        <InfoRow icon={MapPin} label="Address" value={profile?.address} />
                    </View>

                    {/* Contact Information */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Contact Information</Text>
                        <InfoRow icon={Mail} label="Email" value={profile?.email} />
                        <InfoRow icon={Phone} label="Student Phone" value={profile?.phone_number} />
                        <InfoRow icon={Users} label="Parent Name" value={studentData.parent_name} />
                        <InfoRow icon={Phone} label="Parent Phone" value={studentData.parent_phone} />
                    </View>

                    {/* School Information */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>School Information</Text>
                        <InfoRow icon={Bus} label="Transport Status" value={extraInfo.transportStatus} />
                        {extraInfo.transportStatus === 'Yes' && (
                            <InfoRow icon={Bus} label="Transport Route" value={extraInfo.busNumber} />
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleChangePassword}>
                            <Key size={20} color={theme.colors.primary} />
                            <Text style={styles.secondaryBtnText}>Change Password</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <LogOut size={20} color="#fff" />
                            <Text style={styles.logoutBtnText}>Log Out</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.versionText}>Student App v1.0.0</Text>
                    <View style={{ height: 40 }} />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    scrollContent: { paddingBottom: 0 },

    header: {
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        alignItems: 'center',
    },
    headerContent: { alignItems: 'center', width: '100%', paddingTop: 20 },

    profileImageContainer: {
        marginBottom: 16,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    profileImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#fff',
    },
    placeholderImage: {
        backgroundColor: '#cbd5e1', // Slate 300
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#475569',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },

    studentName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    classInfo: {
        fontSize: 16,
        color: '#e2e8f0', // Slate 200
        marginBottom: 12,
        fontWeight: '500',
    },
    admissionBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    admissionText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
    },

    cardsContainer: {
        marginTop: -25, // Overlap header
        paddingHorizontal: 20,
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b', // Slate 800
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#e0e7ff', // Indigo 50
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748b', // Slate 500
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#334155', // Slate 700
        fontWeight: '500',
    },

    actionsContainer: {
        marginTop: 8,
        gap: 12,
    },
    secondaryBtn: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    secondaryBtnText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row',
        backgroundColor: '#ef4444', // Red 500
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    settingsButton: {
        position: 'absolute',
        top: 10,
        right: 20,
        zIndex: 10,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
    },
    versionText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 8,
    },
});
