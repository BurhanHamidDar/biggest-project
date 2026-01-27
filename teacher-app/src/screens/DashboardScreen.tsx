import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, CheckSquare, ClipboardList, Clock, FileText, Users, User, ChevronRight, Settings, Bell, Banknote } from 'lucide-react-native';
import api from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function DashboardScreen({ navigation }: any) {
    const { user, profile } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [latestNotice, setLatestNotice] = useState<any>(null);
    const [loadingNotice, setLoadingNotice] = useState(true);

    // Dynamic Session Calculation
    const currentYear = new Date().getFullYear();
    const activeSession = `${currentYear}-${currentYear + 1}`;
    const activePeriod = "08:00 - 14:30";

    const fetchDashboardData = async () => {
        try {
            // Fetch Notices
            const { data: notices } = await api.get('/notices');
            if (notices && notices.length > 0) {
                setLatestNotice(notices[0]);
            } else {
                setLatestNotice(null);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoadingNotice(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchDashboardData().then(() => setRefreshing(false));
    }, []);

    const FeatureCard = ({ title, subtitle, icon: Icon, color, bgColor, onPress }: any) => (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                <Icon color={color} size={24} />
            </View>
            <View>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header Gradient */}
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.headerGradient}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <View style={styles.headerRow}>
                        <View style={styles.profileSection}>
                            <View style={styles.avatar}>
                                <Image
                                    source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/40' }}
                                    style={{ width: '100%', height: '100%', borderRadius: 24 }}
                                />
                            </View>
                            <View>
                                <Text style={styles.greeting}>Hi, {profile?.full_name?.split(' ')[0] || 'Teacher'}</Text>
                                <Text style={styles.subGreeting}>Ayesha Ali Academy</Text>
                            </View>
                        </View>
                        <View style={styles.headerIcons}>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
                                <User color="#fff" size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                {/* Status Cards (Session Info) */}
                <View style={styles.statusRow}>
                    <View style={styles.statusCard}>
                        <Text style={styles.statusLabel}>Session</Text>
                        <Text style={styles.statusValue}>{activeSession}</Text>
                    </View>
                    <View style={styles.statusCard}>
                        <Text style={styles.statusLabel}>Term</Text>
                        <Text style={styles.statusValue}>{activePeriod.split(' - ')[0]}</Text>
                    </View>
                </View>

                {/* Feature Grid */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.grid}>
                    <FeatureCard
                        title="Add Homework"
                        subtitle="Assign tasks"
                        icon={ClipboardList}
                        color="#0284c7"
                        bgColor="#e0f2fe"
                        onPress={() => navigation.navigate('Homework')}
                    />
                    <FeatureCard
                        title="Attendance"
                        subtitle="Daily Tracker"
                        icon={CheckSquare}
                        color="#16a34a"
                        bgColor="#dcfce7"
                        onPress={() => navigation.navigate('Attendance')}
                    />
                    <FeatureCard
                        title="Class Marks"
                        subtitle="Update Scores"
                        icon={FileText}
                        color="#4338ca"
                        bgColor="#e0e7ff"
                        onPress={() => navigation.navigate('ClassMarks')}
                    />
                    <FeatureCard
                        title="Exam Marks"
                        subtitle="Term Results"
                        icon={BookOpen}
                        color="#9333ea"
                        bgColor="#f3e8ff"
                        onPress={() => navigation.navigate('ExamMarks')}
                    />
                    <FeatureCard
                        title="Time Table"
                        subtitle="My Schedule"
                        icon={Clock}
                        color="#ea580c"
                        bgColor="#ffedd5"
                        onPress={() => navigation.navigate('Timetable')}
                    />
                    <FeatureCard
                        title="Mark Fees"
                        subtitle="Collections"
                        icon={Banknote}
                        color="#0891b2"
                        bgColor="#cffafe"
                        onPress={() => navigation.navigate('MarkFees')}
                    />
                </View>

                {/* Manage Students Strip */}
                <TouchableOpacity style={styles.wideCard} onPress={() => navigation.navigate('Students')}>
                    <View style={styles.wideCardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: '#f1f5f9' }]}>
                            <Users color="#475569" size={24} />
                        </View>
                        <View>
                            <Text style={styles.wideCardTitle}>Student Directory</Text>
                            <Text style={styles.wideCardSub}>View all profiles</Text>
                        </View>
                    </View>
                    <ChevronRight color="#94a3b8" size={20} />
                </TouchableOpacity>

                {/* Latest Notice */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Official Notices</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Notices')}>
                        <Text style={styles.sectionLink}>View All</Text>
                    </TouchableOpacity>
                </View>

                {loadingNotice ? (
                    <ActivityIndicator color={theme.colors.primary} />
                ) : latestNotice ? (
                    <TouchableOpacity style={styles.noticeCard} onPress={() => navigation.navigate('Notices')}>
                        <View style={[styles.iconContainer, { backgroundColor: latestNotice.importance === 'high' ? '#fee2e2' : '#f1f5f9', borderRadius: 12, marginBottom: 0, marginRight: 12 }]}>
                            <Bell color={latestNotice.importance === 'high' ? '#ef4444' : '#64748b'} size={20} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={styles.noticeTitle} numberOfLines={1}>{latestNotice.title}</Text>
                                <Text style={styles.noticeTime}>
                                    {formatDistanceToNow(new Date(latestNotice.created_at), { addSuffix: true }).replace('about ', '')}
                                </Text>
                            </View>
                            <Text style={styles.noticeText} numberOfLines={2}>{latestNotice.content}</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No active notices.</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    headerGradient: {
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: { paddingHorizontal: 24, paddingTop: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    profileSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)'
    },
    greeting: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    subGreeting: { color: '#cbd5e1', fontSize: 13, letterSpacing: 1 },
    headerIcons: { flexDirection: 'row', gap: 16 },
    iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },

    content: { flex: 1, marginTop: -30 },
    scrollContent: { paddingHorizontal: 20 },

    // Status Row
    statusRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statusCard: {
        flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
        alignItems: 'center'
    },
    statusLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: 4 },
    statusValue: { fontSize: 16, color: '#1e293b', fontWeight: 'bold' },

    // Grid
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    card: {
        width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        marginBottom: 4
    },
    iconContainer: {
        width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12
    },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
    cardSubtitle: { fontSize: 12, color: '#64748b' },

    // Wide Card
    wideCard: {
        backgroundColor: '#fff', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
    },
    wideCardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    wideCardTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    wideCardSub: { fontSize: 12, color: '#64748b' },

    // Notices
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionLink: { color: theme.colors.accent, fontWeight: '600', fontSize: 13 },
    noticeCard: {
        backgroundColor: '#fff', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        marginBottom: 12
    },
    noticeTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    noticeTime: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
    noticeText: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },
    emptyCard: { padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16 },
    emptyText: { color: '#94a3b8' }
});
