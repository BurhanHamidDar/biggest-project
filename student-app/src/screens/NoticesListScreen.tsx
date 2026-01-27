import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { Bell, ArrowLeft, FileText, AlertCircle, Info, Calendar } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

interface Notice {
    id: string;
    title: string;
    content: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    read: boolean;
}

export default function NoticesListScreen() {
    const navigation = useNavigation<any>();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotices = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch notices and check for read status
            // Filter by target_role containing 'student' OR 'all' logic if handled by array checks
            // The controller uses cs 'target_role', '{student}'. Let's do the same here.
            const { data, error } = await supabase
                .from('notices')
                .select(`
                    *,
                    notice_reads (user_id)
                `)
                .contains('target_role', ['student'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedNotices = data.map((item: any) => ({
                ...item,
                read: item.notice_reads && item.notice_reads.some((read: any) => read.user_id === user.id)
            }));

            setNotices(formattedNotices);
        } catch (error) {
            console.error('Error fetching notices:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchNotices();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotices();
    };

    const getImportanceColor = (importance: string) => {
        switch (importance) {
            case 'high':
            case 'critical': return '#EF4444'; // Red
            case 'medium': return '#F59E0B'; // Amber
            case 'low': return '#3B82F6'; // Blue
            default: return '#64748B';
        }
    };

    const getIcon = (importance: string) => {
        switch (importance) {
            case 'high':
            case 'critical': return <AlertCircle size={20} color="#EF4444" />;
            case 'medium': return <Info size={20} color="#F59E0B" />;
            case 'low': return <FileText size={20} color="#3B82F6" />;
            default: return <Bell size={20} color="#64748B" />;
        }
    };

    const renderItem = ({ item }: { item: Notice }) => (
        <TouchableOpacity
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => navigation.navigate('NoticeDetail', { noticeId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.typeContainer}>
                    {getIcon(item.importance)}
                    <Text style={[styles.typeText, { color: getImportanceColor(item.importance) }]}>
                        {item.importance.toUpperCase()}
                    </Text>
                </View>
                {(item.importance === 'high' || item.importance === 'critical') && (
                    <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>URGENT</Text>
                    </View>
                )}
            </View>

            <Text style={[styles.title, !item.read && styles.unreadTitle]} numberOfLines={2}>
                {item.title}
            </Text>

            <Text style={styles.preview} numberOfLines={2}>
                {item.content}
            </Text>

            <View style={styles.footer}>
                <Text style={styles.date}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
                {!item.read && <View style={styles.dot} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Student Notices</Text>
                        <Text style={styles.headerSubtitle}>Stay updated with latest announcements</Text>
                    </View>
                </View>
            </LinearGradient>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notices}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Bell size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No notices found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 20, paddingTop: 10, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 16 },
    headerContent: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
    backButton: { marginRight: 16, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },

    listContent: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        borderLeftWidth: 4, borderLeftColor: 'transparent'
    },
    unreadCard: {
        borderLeftColor: '#3B82F6', // Blue indicator for unread
        backgroundColor: '#F0F9FF'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    typeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    typeText: { fontSize: 12, fontWeight: '600', color: '#64748B', letterSpacing: 0.5 },

    priorityBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    priorityText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },

    title: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    unreadTitle: { color: '#0f172a' },

    preview: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 12 },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    date: { fontSize: 12, color: '#94a3b8' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' },

    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: '#94a3b8' }
});
