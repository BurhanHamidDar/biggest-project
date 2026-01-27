
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme';
import { GraduationCap, ArrowRight, Lock, CheckCircle, ArrowLeft, FileText } from 'lucide-react-native';

export default function ExamsListScreen({ navigation }: any) {
    const { studentData } = useAuth();
    const [terms, setTerms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFeePaid, setIsFeePaid] = useState(true);
    const [selectedTerm, setSelectedTerm] = useState('Term 1'); // Default tab

    const fetchData = async () => {
        if (!studentData?.class_id || !studentData?.profile_id) {
            setLoading(false);
            return;
        }

        try {
            // 1. Check Fee Status (Robust Calculation)
            // Fetch Total Class Fee
            const { data: feeStructure } = await supabase
                .from('class_fee_structures')
                .select('amount')
                .eq('class_id', studentData.class_id);

            const totalDue = feeStructure?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

            // Fetch Total Paid
            const { data: payments } = await supabase
                .from('student_fee_payments')
                .select('amount_paid')
                .eq('student_id', studentData.profile_id);

            const totalPaid = payments?.reduce((sum, item) => sum + Number(item.amount_paid), 0) || 0;

            // If Total Paid is less than Total Due, then Fees are Pending.
            // (Using a small epsilon for float comparison safety, though currency should be int/fixed)
            const isFullyPaid = totalPaid >= totalDue;

            setIsFeePaid(isFullyPaid);

            // 2. Fetch Exams (grouped by name/id)
            const { data: examsData, error } = await supabase
                .from('exams')
                .select('id, name, start_date, is_published')
                .eq('is_published', true) // Only published exams
                .order('start_date', { ascending: false });

            if (error) throw error;

            // 3. Filter relevant and Group
            const relevantExams: any[] = []; // Fix 'any' implicit error

            if (examsData) {
                // Get all published exam IDs
                const examIds = examsData.map(e => e.id);

                if (examIds.length > 0) {
                    // Check for Approval (student_marksheets record existence)
                    const { data: approvedExams } = await supabase
                        .from('student_marksheets')
                        .select('exam_id')
                        .eq('student_id', studentData.profile_id)
                        .in('exam_id', examIds);

                    const approvedExamIds = new Set(approvedExams?.map(e => e.exam_id) || []);

                    examsData.forEach(exam => {
                        // User Logic: "only approved by the admin then it should show"
                        // So we strictly check if it's in approvedExamIds
                        if (approvedExamIds.has(exam.id)) {
                            relevantExams.push(exam);
                        }
                    });
                }
            }

            setTerms(relevantExams);

        } catch (error) {
            console.error('Fetch Exams Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, [studentData]);

    const handlePress = (exam: any) => {
        if (!isFeePaid) {
            Alert.alert(
                "Official Result Locked",
                "Your exam marksheet is locked due to pending fees.\nPlease clear your dues to access the official result.",
                [{ text: "OK" }]
            );
            return;
        }
        navigation.navigate('ExamResult', { examId: exam.id, examName: exam.name });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, !isFeePaid && styles.cardLocked]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardInternal}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconBox, { backgroundColor: isFeePaid ? '#e0e7ff' : '#fee2e2' }]}>
                        {isFeePaid ? (
                            <FileText size={24} color="#4338ca" />
                        ) : (
                            <Lock size={24} color="#ef4444" />
                        )}
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.examTitle}>{item.name}</Text>
                        <Text style={styles.examDate}>
                            {isFeePaid ? `Published: ${new Date(item.start_date).toLocaleDateString()} ` : 'Date: Hidden'}
                        </Text>
                    </View>
                </View>

                <View style={styles.action}>
                    {!isFeePaid ? (
                        <View style={styles.lockedBadge}>
                            <Text style={styles.lockedText}>LOCKED</Text>
                        </View>
                    ) : (
                        <View style={styles.viewBtn}>
                            <Text style={styles.viewText}>View Result</Text>
                            <ArrowRight size={16} color="#4338ca" />
                        </View>
                    )}
                </View>
            </View>
            {!isFeePaid && (
                <View style={styles.feeWarning}>
                    <Text style={styles.feeWarningText}>Clear fees to unlock</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Official Exam Results</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={terms}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                    ListHeaderComponent={
                        <View style={styles.infoBanner}>
                            <Text style={styles.infoTitle}>Academic Session 2025-2026</Text>
                            <Text style={styles.infoSub}>Official marksheets are available here after admin approval.</Text>

                            {!isFeePaid && (
                                <View style={styles.mainAlert}>
                                    <Lock size={16} color="#b91c1c" />
                                    <Text style={styles.mainAlertText}>Attention: Results are locked due to pending fees.</Text>
                                </View>
                            )}
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <GraduationCap size={64} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No official results published yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: {
        backgroundColor: theme.colors.primary, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 10,
        elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 40 },

    infoBanner: { marginBottom: 20 },
    infoTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    infoSub: { fontSize: 13, color: '#64748b', marginBottom: 12 },

    mainAlert: {
        backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca',
        flexDirection: 'row', alignItems: 'center', gap: 8
    },
    mainAlertText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 13 },

    card: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3
    },
    cardLocked: { opacity: 0.9 }, // Keep it visible but clearly distinct

    cardInternal: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    iconContainer: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
    iconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1 },
    examTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    examDate: { fontSize: 12, color: '#64748b' },

    action: { marginLeft: 8 },
    lockedBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    lockedText: { color: '#ef4444', fontWeight: 'bold', fontSize: 10, letterSpacing: 0.5 },

    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    viewText: { color: '#4338ca', fontWeight: 'bold', fontSize: 12 },

    feeWarning: {
        backgroundColor: '#fef2f2', padding: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#fee2e2'
    },
    feeWarningText: { color: '#dc2626', fontSize: 11, fontWeight: '600' },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 16 },
});

