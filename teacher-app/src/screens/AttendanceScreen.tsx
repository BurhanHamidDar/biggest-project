import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function AttendanceScreen({ navigation, route }: any) {
    const { user } = useAuth();

    // UI State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data State
    const [hrClass, setHrClass] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});

    // Logic State
    const [status, setStatus] = useState<'not_started' | 'draft' | 'finalized'>('not_started');
    const [summary, setSummary] = useState<any>(null); // Counts if finalized

    const { date, readOnly } = (route.params as any) || {};

    useEffect(() => {
        init();
    }, [date]); // Re-run if params change

    const init = async () => {
        try {
            setLoading(true);

            // 1. Get HR Class
            const { data: teacherData } = await api.get('/teachers/me');
            if (!teacherData.hr_classes || teacherData.hr_classes.length === 0) {
                Alert.alert('Access Denied', 'Only Class Teachers can mark attendance.');
                navigation.goBack();
                return;
            }
            const targetClass = teacherData.hr_classes[0];
            setHrClass(targetClass);

            // 2. Get Students
            const { data: studentList } = await api.get('/students', {
                params: { class_id: targetClass.class_id, section_id: targetClass.section_id }
            });
            setStudents(studentList);

            // 3. Check Status for Today or Selected Date
            const targetDate = date || new Date().toISOString().split('T')[0];

            const { data: statusData } = await api.get('/attendance/status', {
                params: { date: targetDate, class_id: targetClass.class_id, section_id: targetClass.section_id }
            });

            setStatus(statusData.status);

            // Load records if finalized, draft, or read-only mode requested
            if (statusData.status === 'finalized' || statusData.status === 'draft' || readOnly) {
                if (statusData.status === 'finalized') setSummary(statusData.counts);

                const { data: recordsData } = await api.get('/attendance', {
                    params: { date: targetDate, class_id: targetClass.class_id, section_id: targetClass.section_id }
                });
                const map: any = {};
                recordsData.records.forEach((r: any) => map[r.student_id] = r.status);
                setAttendance(map);
            } else {
                // Not Started (and not view mode) -> Default all present
                if (!readOnly) {
                    const initial: any = {};
                    studentList.forEach((s: any) => initial[s.profile_id] = 'present');
                    setAttendance(initial);
                } else {
                    setAttendance({});
                }
            }

        } catch (error) {
            Alert.alert('Error', 'Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (id: string) => {
        if (readOnly || status === 'finalized') return;
        setAttendance(prev => ({
            ...prev,
            [id]: prev[id] === 'present' ? 'absent' : 'present'
        }));
    };

    const saveDraft = async (finalize = false) => {
        if (readOnly) return;
        try {
            setSubmitting(true);
            const targetDate = date || new Date().toISOString().split('T')[0];
            const records = students.map(s => ({
                student_id: s.profile_id,
                status: attendance[s.profile_id],
                remarks: ''
            }));

            // 1. Save (Upsert as Draft)
            await api.post('/attendance', {
                date: targetDate,
                class_id: hrClass.class_id,
                section_id: hrClass.section_id,
                marked_by: user.id,
                records
            });

            // 2. Finalize if requested
            if (finalize) {
                await api.post('/attendance/finalize', {
                    date: targetDate,
                    class_id: hrClass.class_id,
                    section_id: hrClass.section_id
                });
                Alert.alert('Success', 'Attendance Finalized.');
                setStatus('finalized');
                init();
            } else {
                Alert.alert('Saved', 'Attendance saved as draft.');
                setStatus('draft');
            }

        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmFinalize = () => {
        if (readOnly) return;
        Alert.alert(
            'Finalize Attendance?',
            'Once finalized, you cannot make further changes for this date.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Finalize', onPress: () => saveDraft(true) }
            ]
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

    const presentCount = Object.values(attendance).filter(k => k === 'present').length;
    const absentCount = students.length - presentCount;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Attendance</Text>
                        <Text style={styles.headerSubtitle}>
                            {date ? new Date(date).toDateString() : new Date().toDateString()}
                        </Text>
                    </View>
                    {(status === 'finalized' || readOnly) && (
                        <View style={styles.lockBadge}>
                            <Lock color="#fff" size={14} />
                            <Text style={styles.lockText}>Locked</Text>
                        </View>
                    )}
                </SafeAreaView>
            </LinearGradient>

            {(status === 'finalized' || readOnly) && (
                <View style={styles.banner}>
                    <Text style={styles.bannerText}>
                        {readOnly ? 'Viewing past attendance (Read Only)' : "Today's attendance is finalized."}
                    </Text>
                </View>
            )}

            <View style={styles.stats}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statVal}>{students.length}</Text>
                </View>
                <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0' }]}>
                    <Text style={styles.statLabel}>Present</Text>
                    <Text style={[styles.statVal, { color: '#10b981' }]}>{presentCount}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Absent</Text>
                    <Text style={[styles.statVal, { color: '#ef4444' }]}>{absentCount}</Text>
                </View>
            </View>

            <FlatList
                data={students}
                keyExtractor={item => item.profile_id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const isPresent = attendance[item.profile_id] === 'present';
                    return (
                        <View style={[styles.card, (status === 'finalized' || readOnly) && styles.cardDisabled]}>
                            <View>
                                <Text style={styles.name}>{item.profiles.full_name}</Text>
                                <Text style={styles.roll}>{item.roll_no || 'No Roll No'}</Text>
                            </View>
                            <TouchableOpacity
                                disabled={readOnly || status === 'finalized'}
                                onPress={() => toggleStatus(item.profile_id)}
                                style={[styles.toggle, isPresent ? styles.present : styles.absent, (readOnly || status === 'finalized') && { opacity: 0.7 }]}
                            >
                                <Text style={styles.toggleText}>{isPresent ? 'P' : 'A'}</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />

            {(!readOnly && status !== 'finalized') && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.draftBtn} onPress={() => saveDraft(false)} disabled={submitting}>
                        <Text style={styles.draftText}>Save Draft</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.finalBtn} onPress={confirmFinalize} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.finalText}>Finalize</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        marginRight: 16
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    headerSubtitle: { color: '#cbd5e1' },
    lockBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', padding: 6, borderRadius: 20 },
    lockText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
    banner: { backgroundColor: '#fff7ed', padding: 12, alignItems: 'center' },
    bannerText: { color: '#c2410c', fontWeight: 'bold' },
    stats: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    statBox: { flex: 1, padding: 16, alignItems: 'center' },
    statLabel: { color: '#64748b', fontSize: 12 },
    statVal: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    list: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#fff', padding: 16, marginBottom: 10, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
    cardDisabled: { backgroundColor: '#f1f5f9' },
    name: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    roll: { color: '#64748b', fontSize: 12 },
    toggle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    present: { backgroundColor: '#d1fae5' },
    absent: { backgroundColor: '#fee2e2' },
    toggleText: { fontWeight: 'bold', fontSize: 16, color: '#1e293b' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', gap: 12 },
    draftBtn: { flex: 1, backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center' },
    draftText: { color: '#334155', fontWeight: 'bold' },
    finalBtn: { flex: 1, backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    finalText: { color: '#fff', fontWeight: 'bold' }
});
