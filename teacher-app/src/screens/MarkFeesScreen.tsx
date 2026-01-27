import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import api from '../lib/api';
import { ArrowLeft, CheckCircle, XCircle, Filter, RefreshCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function MarkFeesScreen({ navigation }: any) {
    const { profile } = useAuth();
    const { showAlert } = useAlert();

    const [loading, setLoading] = useState(true);
    const [hrClass, setHrClass] = useState<any>(null);
    const [structures, setStructures] = useState<any[]>([]);
    const [selectedStructure, setSelectedStructure] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // 1. Fetch HR Class & Fee Structures
    const fetchInitData = async () => {
        try {
            setLoading(true);
            // Check HR Status
            const { data: hrData } = await api.get('/teachers/me/hr-class'); // Need this endpoint or query generic table?
            // Existing endpoints might not be specific. Let's use direct Supabase or custom endpoint if available.
            // Let's assume we can fetch "my assignments" or similar.
            // Actually, we can just fetch all classes and filter? No.
            // Let's use the same logic as ProfileScreen to check HR status.

            // Replicating ProfileScreen logic for HR check (using raw supabase client if needed, or api if exposed)
            // api object is axios instance, usually wraps backend calls. 
            // Our backend doesn't have "get my hr class" explicit route maybe?
            // Let's assume we use the supabase client directly for some read ops if API is missing, 
            // OR we can add an endpoint.
            // But wait, `api` in `lib/api` is likely just axios.
            // Let's fallback to `supabase` client for read if needed, but we should use `api` for consistency.
            // I'll assume we can use `supabase` from `../lib/supabase` as in ProfileScreen.

        } catch (error) {
            console.error(error);
        }
    };

    // Let's use `supabase` for the read-heavy/complex status checks to match ProfileScreen pattern
    const { supabase } = require('../lib/supabase');

    const loadData = async () => {
        try {
            setLoading(true);
            if (!profile?.id) return;

            // A. Get HR Class
            const { data: hrData, error: hrError } = await supabase
                .from('class_teachers')
                .select('class_id, section_id, classes(name), sections(name)')
                .eq('teacher_id', profile.id)
                .maybeSingle();

            if (hrError) throw hrError;

            if (!hrData) {
                showAlert({
                    type: 'error',
                    title: 'Access Denied',
                    message: 'You are not assigned as an HR Teacher.',
                    onConfirm: () => navigation.goBack()
                });
                return;
            }

            setHrClass(hrData);

            // B. Get Fee Structures for this class
            const { data: feeStructs, error: fErr } = await supabase
                .from('class_fee_structures')
                .select('id, amount, due_date, fee_types(name)')
                .eq('class_id', hrData.class_id)
                .order('due_date', { ascending: false });

            if (fErr) throw fErr;
            setStructures(feeStructs || []);
            if (feeStructs && feeStructs.length > 0) {
                setSelectedStructure(feeStructs[0]);
            }

            // C. Get Students
            const { data: studData, error: sErr } = await supabase
                .from('students')
                .select('profile_id, roll_no, profiles!profile_id(full_name, avatar_url)')
                .eq('class_id', hrData.class_id)
                .eq('section_id', hrData.section_id)
                .eq('section_id', hrData.section_id)
                .order('roll_no', { ascending: true });

            if (sErr) throw sErr;
            setStudents(studData || []);

            // D. Get All Payments for this class (optimization: fetch all instead of N+1)
            // We need payments for the selected structure? Yes.
            // Fetching in next effect.

        } catch (error: any) {
            showAlert({ type: 'error', title: 'Error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async () => {
        if (!selectedStructure) return;
        try {
            const { data: payData, error: pErr } = await supabase
                .from('student_fee_payments')
                .select('student_id, amount_paid, status')
                .eq('class_fee_structure_id', selectedStructure.id);

            if (pErr) throw pErr;
            setPayments(payData || []);
        } catch (error) {
            console.error('Fetch Payments Error:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [selectedStructure]);

    const getStatus = (studentId: string) => {
        if (!selectedStructure) return 'pending';
        // Check payments
        // Sum amounts? Or just check status?
        // Since we allow partial, we should sum.
        const studPayments = payments.filter(p => p.student_id === studentId);
        const totalPaid = studPayments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);

        if (totalPaid >= selectedStructure.amount) return 'paid';
        return 'unpaid';
    };

    const handleToggle = async (student: any) => {
        if (!selectedStructure) return;
        const currentStatus = getStatus(student.profile_id);
        const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';

        const actionText = newStatus === 'paid' ? 'Mark as PAID' : 'Mark as UNPAID';
        const color = newStatus === 'paid' ? 'green' : 'red';
        const message = newStatus === 'paid'
            ? `Are you sure ${student.profiles.full_name} has paid the full amount of ₹${selectedStructure.amount}?`
            : `Are you sure you want to revert payment status for ${student.profiles.full_name}? This will delete payment records.`;

        showAlert({
            type: 'confirm',
            title: actionText,
            message: message,
            onConfirm: async () => {
                try {
                    setProcessingId(student.profile_id);
                    // Call API
                    const response = await api.put('/fees/status', {
                        student_id: student.profile_id,
                        class_fee_structure_id: selectedStructure.id,
                        status: newStatus
                    });

                    if (response.data) {
                        // Refresh payments locally or fetch again
                        // Simpler to fetch again
                        await fetchPayments();
                        showAlert({ type: 'success', title: 'Success', message: 'Status updated.' });
                    }
                } catch (error: any) {
                    showAlert({ type: 'error', title: 'Update Failed', message: error.response?.data?.error || error.message });
                } finally {
                    setProcessingId(null);
                }
            }
        });
    };

    const renderStudent = ({ item }: { item: any }) => {
        const status = getStatus(item.profile_id);
        const isPaid = status === 'paid';
        const isProcessing = processingId === item.profile_id;

        return (
            <TouchableOpacity
                style={[styles.studentCard, isPaid ? styles.cardPaid : styles.cardUnpaid]}
                onPress={() => handleToggle(item)}
                disabled={isProcessing}
            >
                <View style={styles.studentInfo}>
                    <Text style={styles.rollNo}>#{item.roll_no}</Text>
                    <Text style={styles.studentName}>{item.profiles.full_name}</Text>
                </View>

                <View style={styles.statusAction}>
                    {isProcessing ? (
                        <ActivityIndicator color={isPaid ? '#059669' : '#dc2626'} />
                    ) : isPaid ? (
                        <>
                            <Text style={[styles.statusText, { color: '#059669' }]}>PAID</Text>
                            <CheckCircle size={24} color="#059669" />
                        </>
                    ) : (
                        <>
                            <Text style={[styles.statusText, { color: '#dc2626' }]}>UNPAID</Text>
                            <XCircle size={24} color="#dc2626" />
                        </>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Mark Fees</Text>
                        <Text style={styles.headerSubtitle}>
                            {hrClass ? `${hrClass.classes.name} - ${hrClass.sections.name}` : 'Loading...'}
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Fee Structure Selector */}
            <View style={styles.selectorContainer}>
                <Text style={styles.selectorLabel}>FEE TYPE:</Text>
                <FlatList
                    data={structures}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.chip,
                                selectedStructure?.id === item.id && styles.chipActive
                            ]}
                            onPress={() => setSelectedStructure(item)}
                        >
                            <Text style={[
                                styles.chipText,
                                selectedStructure?.id === item.id && styles.chipTextActive
                            ]}>
                                {item.fee_types.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Main List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={item => item.profile_id}
                    renderItem={renderStudent}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No students found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 16,
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#cbd5e1',
        marginTop: 2,
    },
    selectorContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    selectorLabel: {
        marginLeft: 16,
        fontSize: 11,
        fontWeight: '800',
        color: '#6B7280',
        marginBottom: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    chipTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    studentCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E7EB', // Default border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardPaid: {
        borderLeftWidth: 4,
        borderLeftColor: '#059669',
    },
    cardUnpaid: {
        borderLeftWidth: 4,
        borderLeftColor: '#dc2626',
    },
    studentInfo: {},
    rollNo: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 2,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    statusAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#6B7280',
    }
});
