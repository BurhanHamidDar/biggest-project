import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../lib/api';
import { theme } from '../theme';
import { Bell, ArrowLeft, FileText, AlertCircle, Info } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

interface Notice {
    id: string;
    title: string;
    content: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    read?: boolean;
}

export default function NoticesScreen({ navigation }: any) {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotices = async () => {
        try {
            const { data } = await api.get('/notices');
            // Assuming data is array of notices
            setNotices(data);
        } catch (error) {
            console.error('Error fetching notices:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

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
            style={[styles.card]}
            onPress={() => {
                // Determine screen to navigate - NoticeDetail might not exist in Teacher App yet?
                // Checking file list: NoticeDetailScreen.tsx DOES NOT exist in Teacher App list.
                // Dashboard linked to 'Notices' screen. 
                // We should perhaps just expand items or create a detail modal?
                // For now, let's just make it viewable or assume we might need a detail view later.
                // Or just expand in place?
                // Student app navigates to NoticeDetail. 
                // Let's just do nothing for now or alert, or better yet, just show content nicely in card.
            }}
            activeOpacity={1} // Disable click feedback if no detail screen
        >
            <View style={styles.cardHeader}>
                <View style={styles.typeContainer}>
                    {getIcon(item.importance || 'medium')}
                    <Text style={[styles.typeText, { color: getImportanceColor(item.importance || 'medium') }]}>
                        {(item.importance || 'NOTICE').toUpperCase()}
                    </Text>
                </View>
                {(item.importance === 'high' || item.importance === 'critical') && (
                    <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>URGENT</Text>
                    </View>
                )}
            </View>

            <Text style={styles.title} numberOfLines={2}>
                {item.title}
            </Text>

            <Text style={styles.preview}>
                {item.content}
            </Text>

            <View style={styles.footer}>
                <Text style={styles.date}>
                    {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : 'Just now'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.header}>
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Notices & Announcements</Text>
                        <Text style={styles.headerSubtitle}>Official Updates</Text>
                    </View>
                </SafeAreaView>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, gap: 16 },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

    listContent: { padding: 16, paddingTop: 24, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    typeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    typeText: { fontSize: 12, fontWeight: '600', color: '#64748B', letterSpacing: 0.5 },

    priorityBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    priorityText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },

    title: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
    preview: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 12 },

    footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    date: { fontSize: 12, color: '#94a3b8' },

    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: '#94a3b8' }
});
