import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme';
import { ChevronRight, ClipboardList, Calendar, CheckCircle2, XCircle, User, ArrowLeft } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

export default function ClassTestsScreen({ navigation }: any) {
    const { studentData } = useAuth();
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTest, setSelectedTest] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchTests = async () => {
        if (!studentData?.class_id || !studentData?.section_id) {
            setLoading(false);
            return;
        }

        try {
            // Fetch tests for this class/section
            // Join with class_test_marks for THIS student
            const { data: testsData, error } = await supabase
                .from('class_tests')
                .select(`
                    *,
                    subjects (name),
                    teachers (profiles (full_name)),
                    class_test_marks (
                        marks_obtained,
                        remarks
                    )
                `)
                .eq('class_id', studentData.class_id)
                .eq('section_id', studentData.section_id)
                .eq('status', 'finalized') // Only show finalized tests
                .eq('class_test_marks.student_id', studentData.profile_id) // Filter marks for this student
                .order('test_date', { ascending: false });

            if (error) throw error;

            // Process data to flatten structure
            const processed = testsData?.map(test => ({
                id: test.id,
                title: test.title,
                subject: test.subjects?.name || 'General',
                teacher: test.teachers?.profiles?.full_name || 'Unknown',
                date: test.test_date || test.created_at,
                max_marks: test.max_marks,
                obtained: test.class_test_marks?.[0]?.marks_obtained, // Can be null if not marked yet or absent
                remarks: test.class_test_marks?.[0]?.remarks,
                is_marked: test.class_test_marks && test.class_test_marks.length > 0
            })) || [];

            setTests(processed);

        } catch (error) {
            console.error('Fetch Class Tests Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTests();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchTests();
    }, [studentData]);

    const getStatus = (obtained: number | null, max: number) => {
        if (obtained === null || obtained === undefined) return { label: 'Pending', color: '#64748b', bg: '#f1f5f9' };

        const percentage = (obtained / max) * 100;
        if (percentage >= 35) return { label: 'Pass', color: '#16a34a', bg: '#dcfce7' };
        return { label: 'Fail', color: '#dc2626', bg: '#fee2e2' };
    };

    const handleTestPress = (test: any) => {
        setSelectedTest(test);
        setModalVisible(true);
    };

    const renderItem = ({ item }: { item: any }) => {
        const { label, color, bg } = getStatus(item.obtained, item.max_marks);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleTestPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.subjectRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                            <ClipboardList size={20} color={theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.subject}>{item.subject}</Text>
                            <Text style={styles.testTitleItem}>{item.title}</Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: bg }]}>
                        <Text style={[styles.badgeText, { color: color }]}>{label}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                    <Text style={styles.marksText}>
                        Marks: <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{item.obtained ?? '-'}/{item.max_marks}</Text>
                    </Text>
                    <Text style={styles.dateText}>{item.date ? format(parseISO(item.date), 'dd MMM yyyy') : 'No Date'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Class Test Marks</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={tests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <ClipboardList size={64} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No class tests found.</Text>
                        </View>
                    }
                />
            )}

            {/* Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Test Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <XCircle color="#64748b" size={24} />
                            </TouchableOpacity>
                        </View>

                        {selectedTest && (
                            <ScrollView>
                                <View style={styles.detailRow}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Subject</Text>
                                        <Text style={styles.detailValue}>{selectedTest.subject}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Date</Text>
                                        <Text style={styles.detailValue}>{selectedTest.date ? format(parseISO(selectedTest.date), 'dd MMM yyyy') : '-'}</Text>
                                    </View>
                                </View>

                                <View style={styles.testInfo}>
                                    <Text style={styles.infoTitle}>{selectedTest.title}</Text>
                                    <View style={styles.teacherRow}>
                                        <User size={14} color="#64748b" />
                                        <Text style={styles.teacherText}>{selectedTest.teacher}</Text>
                                    </View>
                                </View>

                                <View style={styles.resultBox}>
                                    <Text style={styles.resultLabel}>Marks Obtained</Text>
                                    <View style={styles.marksRow}>
                                        <Text style={styles.marksBig}>{selectedTest.obtained ?? '-'}</Text>
                                        <Text style={styles.marksTotal}>/ {selectedTest.max_marks}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusPill,
                                        { backgroundColor: getStatus(selectedTest.obtained, selectedTest.max_marks).bg }
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            { color: getStatus(selectedTest.obtained, selectedTest.max_marks).color }
                                        ]}>
                                            {getStatus(selectedTest.obtained, selectedTest.max_marks).label}
                                        </Text>
                                    </View>
                                </View>

                                {selectedTest.remarks && (
                                    <View style={styles.remarksBox}>
                                        <Text style={styles.remarksLabel}>Teacher's Remarks</Text>
                                        <Text style={styles.remarksText}>{selectedTest.remarks}</Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    subjectRow: { flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    subject: { fontSize: 12, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
    testTitleItem: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    marksText: { fontSize: 14, color: '#64748b' },
    dateText: { fontSize: 12, color: '#94a3b8' },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 16 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },

    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
    detailValue: { fontSize: 16, fontWeight: 'bold', color: '#334155' },

    testInfo: { marginBottom: 24, padding: 16, backgroundColor: '#f8fafc', borderRadius: 12 },
    infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
    teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    teacherText: { color: '#64748b', fontSize: 13 },

    resultBox: { alignItems: 'center', marginBottom: 24 },
    resultLabel: { fontSize: 14, color: '#64748b', marginBottom: 8 },
    marksRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 12 },
    marksBig: { fontSize: 36, fontWeight: 'bold', color: '#1e293b' },
    marksTotal: { fontSize: 18, color: '#94a3b8' },
    statusPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontWeight: 'bold', fontSize: 14 },

    remarksBox: { padding: 16, backgroundColor: '#fffbeb', borderRadius: 12, borderWidth: 1, borderColor: '#fcd34d' },
    remarksLabel: { fontSize: 12, fontWeight: 'bold', color: '#b45309', marginBottom: 4 },
    remarksText: { color: '#92400e', lineHeight: 20 }
});
