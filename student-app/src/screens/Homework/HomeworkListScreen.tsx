import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme';
import { ChevronRight, ClipboardList, Calendar, Clock, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { format, isAfter, isToday, parseISO } from 'date-fns';

export default function HomeworkListScreen({ navigation }: any) {
    const { studentData } = useAuth();
    const [homework, setHomework] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHomework = async () => {
        // ... existing fetch logic ...
        if (!studentData?.class_id || !studentData?.section_id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('homework')
                .select(`
                    *,
                    subjects (name),
                    teachers (profiles (full_name))
                `)
                .eq('class_id', studentData.class_id)
                .eq('section_id', studentData.section_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHomework(data || []);
        } catch (error) {
            console.error('Fetch Homework Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchHomework();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchHomework();
    }, [studentData]);

    const getStatus = (dueDate: string) => {
        const due = parseISO(dueDate);
        const now = new Date();

        if (isToday(due)) return { label: 'Due Today', color: '#f97316', bg: '#ffedd5' }; // Orange
        if (isAfter(now, due)) return { label: 'Overdue', color: '#ef4444', bg: '#fee2e2' }; // Red
        return { label: 'Pending', color: '#3b82f6', bg: '#dbeafe' }; // Blue
    };

    const renderItem = ({ item }: { item: any }) => {
        const { label, color, bg } = getStatus(item.due_date);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('HomeworkDetail', { homework: item })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.subjectRow}>
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.background }]}>
                            <ClipboardList size={20} color={theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.subject}>{item.subjects?.name || 'General'}</Text>
                            <Text style={styles.teacher}>By {item.teachers?.profiles?.full_name}</Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: bg }]}>
                        <Text style={[styles.badgeText, { color: color }]}>{label}</Text>
                    </View>
                </View>

                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

                <View style={styles.footer}>
                    <View style={styles.dateRow}>
                        <Calendar size={14} color="#64748b" />
                        <Text style={styles.dateText} numberOfLines={1}>Due: {format(parseISO(item.due_date), 'dd MMM yyyy')}</Text>
                    </View>
                    <ChevronRight size={20} color="#cbd5e1" />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Homework</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={homework}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ClipboardList size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No homework assigned yet.</Text>
                        <Text style={styles.emptySub}>Enjoy your free time!</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        backgroundColor: theme.colors.primary, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 10
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 40 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    subjectRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    subject: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    teacher: { fontSize: 12, color: '#64748b' },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

    title: { fontSize: 15, color: '#334155', marginBottom: 16, lineHeight: 22 },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 10 },
    dateText: { fontSize: 13, color: '#64748b', fontWeight: '500', flexShrink: 1 },

    emptyContainer: { alignItems: 'center', marginTop: 100, padding: 20 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#475569', marginTop: 16 },
    emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 8 }
});
