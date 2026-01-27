import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { LogOut, User, Phone, Shield, Calendar, Lock, BookOpen, Mail, Key, Settings } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function ProfileScreen({ navigation }: any) {
    const { profile, signOut } = useAuth();
    const { showAlert } = useAlert();
    const [hrClass, setHrClass] = useState<string | null>(null);
    const [extendedProfile, setExtendedProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [changePassVisible, setChangePassVisible] = useState(false);

    const fetchTeacherDetails = async () => {
        try {
            if (!profile?.id) return;

            // 1. Get Teacher Details
            const { data: teacher, error: teacherError } = await supabase
                .from('teachers')
                .select('profile_id, joining_date, dob')
                .eq('profile_id', profile.id)
                .single();

            if (teacherError) {
                if (teacherError.code !== 'PGRST116') { // PGRST116 is JSON object null (no rows)
                    console.error('Teacher fetch error:', teacherError);
                }
            }

            if (teacher) {
                setExtendedProfile(teacher);
            }

            // 2. Check for HR Class
            const { data: hrData, error: hrError } = await supabase
                .from('class_teachers')
                .select(`
                    id, 
                    classes:class_id(name), 
                    sections:section_id(name)
                `)
                .eq('teacher_id', profile.id)
                .maybeSingle();

            if (hrData && hrData.classes && hrData.sections) {
                // @ts-ignore
                setHrClass(`Grade ${hrData.classes.name} - ${hrData.sections.name}`);
            } else {
                setHrClass(null);
            }

        } catch (error: any) {
            console.error('Profile fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeacherDetails();
    }, [profile]);

    const handleChangePassword = () => {
        setChangePassVisible(true);
    };

    const handleSignOutPress = () => {
        showAlert({
            type: 'confirm',
            title: 'Sign Out',
            message: 'Are you sure you want to sign out?',
            onConfirm: () => signOut()
        });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not Set';
        return format(new Date(dateString), 'dd MMM yyyy');
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

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTeacherDetails} tintColor={theme.colors.primary} />}
            >
                {/* Header Section */}
                <LinearGradient
                    colors={[theme.colors.primary, '#1e1b4b']}
                    style={styles.header}
                >
                    <SafeAreaView edges={['top']} style={styles.headerContent}>
                        {/* Settings Button */}
                        <TouchableOpacity
                            style={styles.settingsBtn}
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
                                        {profile?.full_name?.charAt(0) || 'T'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.verifiedBadge}>
                                <Shield size={12} color="#fff" fill={theme.colors.primary} />
                            </View>
                        </View>

                        <Text style={styles.name}>{profile?.full_name || 'Teacher'}</Text>

                        <View style={styles.subjectRow}>
                            <Text style={styles.subject}>
                                {profile?.department || extendedProfile?.subject_specialization || 'General Subject'}
                            </Text>
                        </View>

                        {hrClass ? (
                            <View style={styles.hrBadge}>
                                <Text style={styles.hrText}>HR Teacher • {hrClass}</Text>
                            </View>
                        ) : null}
                    </SafeAreaView>
                </LinearGradient>

                {/* Content Section */}
                <View style={styles.content}>

                    {/* Personal Information */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Personal Information</Text>
                        <InfoRow icon={User} label="Username" value={profile?.username} />
                        <InfoRow icon={Phone} label="Phone Number" value={profile?.phone_number} />
                        <InfoRow icon={Mail} label="Email" value={profile?.email} />
                        <InfoRow icon={Calendar} label="Date of Birth" value={extendedProfile?.dob ? formatDate(extendedProfile.dob) : null} />
                    </View>

                    {/* Professional Info */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Professional Details</Text>
                        <InfoRow icon={Shield} label="Teacher ID" value={profile?.id?.substring(0, 8).toUpperCase()} />
                        <InfoRow icon={Calendar} label="Joining Date" value={extendedProfile?.joining_date ? formatDate(extendedProfile.joining_date) : null} />
                        <InfoRow icon={BookOpen} label="Specialization" value={extendedProfile?.subject_specialization || profile?.department} />
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleChangePassword}>
                            <Key size={20} color={theme.colors.primary} />
                            <Text style={styles.secondaryBtnText}>Change Password</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOutPress}>
                            <LogOut size={20} color="#fff" />
                            <Text style={styles.logoutBtnText}>Log Out</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.versionText}>Teacher App v1.1.0</Text>
                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>

            <ChangePasswordModal
                visible={changePassVisible}
                onClose={() => setChangePassVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    scrollContent: { paddingBottom: 0 },

    header: {
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        alignItems: 'center',
    },
    headerContent: { alignItems: 'center', width: '100%', paddingTop: 20 },

    settingsBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 10,
    },

    profileImageContainer: {
        marginBottom: 16,
        position: 'relative',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    },
    profileImage: {
        width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#fff',
    },
    placeholderImage: {
        backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center',
    },
    initials: { fontSize: 40, fontWeight: 'bold', color: '#fff' },
    verifiedBadge: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary,
        width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#fff',
    },

    name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    subjectRow: { marginBottom: 12 },
    subject: { fontSize: 16, color: '#e2e8f0', fontWeight: '500' },

    hrBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    },
    hrText: { color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

    content: { marginTop: -25, paddingHorizontal: 20, gap: 16 },

    card: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    cardTitle: {
        fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 16,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8,
    },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 16 },
    iconBox: {
        width: 40, height: 40, borderRadius: 10, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center',
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
    infoValue: { fontSize: 15, color: '#334155', fontWeight: '500' },

    actionsContainer: { marginTop: 8, gap: 12 },
    secondaryBtn: {
        flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10,
        borderWidth: 1, borderColor: theme.colors.primary,
    },
    secondaryBtnText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },

    logoutBtn: {
        flexDirection: 'row', backgroundColor: '#ef4444', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10,
        shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    versionText: { textAlign: 'center', marginTop: 16, color: '#94a3b8', fontSize: 12 }
});
