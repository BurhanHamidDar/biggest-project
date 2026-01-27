import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { ArrowLeft, MessageSquare, BookOpen, Clock, AlertCircle } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

interface Remark {
    id: string;
    student_id: string;
    teacher_id: string;
    note_text: string;
    note_type: string;
    subject: string | null;
    created_at: string;
    teacher_name?: string;
    read: boolean;
}

export default function RemarksListScreen() {
    const navigation = useNavigation<any>();
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRemarks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch remarks + teacher details + read status
            const { data, error } = await supabase
                .from('student_notes')
                .select(`
                    *,
                    teacher:profiles!student_notes_teacher_id_fkey(full_name),
                    student_note_reads(student_id)
                `)
                .eq('student_id', user.id) // Ensure only own notes
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedRemarks = data.map((item: any) => ({
                id: item.id,
                student_id: item.student_id,
                teacher_id: item.teacher_id,
                note_text: item.note_text,
                note_type: item.note_type,
                subject: item.subject,
                created_at: item.created_at,
                // Handle nested teacher profile safely
                teacher_name: item.teacher?.full_name || 'Teacher',
                // Check if reading record exists
                read: item.student_note_reads && item.student_note_reads.some((read: any) => read.student_id === user.id)
            }));

            setRemarks(formattedRemarks);
        } catch (error) {
            console.error('Error fetching remarks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRemarks();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchRemarks();
    };

    const renderItem = ({ item }: { item: Remark }) => (
        <TouchableOpacity
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => navigation.navigate('RemarkDetail', { remarkId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.subjectContainer}>
                    <BookOpen size={16} color={theme.colors.primary} />
                    <Text style={styles.subjectText}>
                        {item.subject ? item.subject : item.note_type || 'General'}
                    </Text>
                </View>
                <Text style={styles.date}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
            </View>

            <Text style={[styles.teacherName, !item.read && styles.unreadText]}>
                {item.teacher_name}
            </Text>

            <Text style={styles.preview} numberOfLines={2}>
                {item.note_text}
            </Text>

            <View style={styles.footer}>
                {!item.read && (
                    <View style={styles.unreadBadge}>
                        <View style={styles.dot} />
                        <Text style={styles.unreadoLabel}>New Remark</Text>
                    </View>
                )}
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
                        <Text style={styles.headerTitle}>Teacher Remarks</Text>
                        <Text style={styles.headerSubtitle}>Feedback & Notes from your teachers</Text>
                    </View>
                </View>
            </LinearGradient>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={remarks}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <AlertCircle size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No teacher remarks yet.</Text>
                            <Text style={styles.emptySubText}>Your teachers will leave feedback here.</Text>
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
        borderLeftColor: theme.colors.primary,
        backgroundColor: '#F0F9FF'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    subjectContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    subjectText: { fontSize: 12, fontWeight: '600', color: '#475569' },
    date: { fontSize: 12, color: '#94a3b8' },

    teacherName: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    unreadText: { color: '#0f172a' },

    preview: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 12 },

    footer: { flexDirection: 'row', alignItems: 'center' },
    unreadBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
    unreadoLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },

    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#64748B' },
    emptySubText: { fontSize: 14, color: '#94a3b8' }
});
