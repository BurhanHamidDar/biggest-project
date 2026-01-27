import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, BookOpen, GraduationCap, IndianRupee, FileText, ChevronRight, TrendingUp, ClipboardList, Calendar } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
    const { studentData, profile } = useAuth();
    const navigation = useNavigation<any>();
    const [refreshing, setRefreshing] = useState(false);
    const [remarks, setRemarks] = useState<any[]>([]);
    const [attendancePct, setAttendancePct] = useState(0);
    const [className, setClassName] = useState('Loading...');
    const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Absent' | 'No Data'>('No Data');
    const [pendingHomework, setPendingHomework] = useState(0);
    const [performance, setPerformance] = useState({ title: 'Keep Learning', sub: 'Your academic performance stats will appear here.' });

    const fetchData = async () => {
        if (!studentData?.profile_id) return;

        try {
            // 1. Fetch Class & Section Details
            if (studentData.class_id) {
                const { data: classData } = await supabase.from('classes').select('name').eq('id', studentData.class_id).single();

                let sectionName = '';
                if (studentData.section_id) {
                    const { data: sectionData } = await supabase.from('sections').select('name').eq('id', studentData.section_id).single();
                    if (sectionData) sectionName = sectionData.name;
                }

                if (classData) {
                    setClassName(`${classData.name}${sectionName ? ` - ${sectionName}` : ''}`);
                }

                // 2. Fetch Pending Homework Count
                const today = new Date().toISOString().split('T')[0];
                const { count } = await supabase
                    .from('homework')
                    .select('*', { count: 'exact', head: true })
                    .eq('class_id', studentData.class_id)
                    .eq('section_id', studentData.section_id)
                    .gte('due_date', today);

                if (count !== null) setPendingHomework(count);
            }

            // 3. Fetch Remarks (student_notes)
            const { data: remarksData } = await supabase
                .from('student_notes')
                .select(`
                    id, 
                    created_at, 
                    note_text, 
                    subject, 
                    note_type,
                    teacher:profiles!student_notes_teacher_id_fkey(full_name)
                `)
                .eq('student_id', studentData.profile_id)
                .order('created_at', { ascending: false })
                .limit(2);

            if (remarksData) setRemarks(remarksData);

            // 4. Fetch Attendance Stats
            const { count: presentCount } = await supabase
                .from('attendance_records')
                .select('id', { count: 'exact', head: true })
                .eq('student_id', studentData.profile_id)
                .eq('status', 'present');

            const { count: totalCount } = await supabase
                .from('attendance_records')
                .select('id', { count: 'exact', head: true })
                .eq('student_id', studentData.profile_id);

            if (totalCount && totalCount > 0) {
                setAttendancePct(Math.round(((presentCount || 0) / totalCount) * 100));
            } else {
                setAttendancePct(0);
            }

            // 5. Check Today's Attendance
            const today = new Date().toISOString().split('T')[0];
            const { data: registers } = await supabase
                .from('attendance_registers')
                .select('id')
                .eq('date', today);

            if (registers && registers.length > 0) {
                const registerIds = registers.map(r => r.id);
                const { data: record } = await supabase
                    .from('attendance_records')
                    .select('status')
                    .eq('student_id', studentData.profile_id)
                    .in('register_id', registerIds)
                    .single();

                if (record) {
                    setAttendanceStatus(record.status === 'present' ? 'Present' : 'Absent');
                } else {
                    setAttendanceStatus('No Data');
                }
            }

            // 6. Calculate Performance (Marks)
            const { data: marksData } = await supabase
                .from('marks')
                .select(`
                    marks_obtained,
                    exam_subjects (max_marks)
                `)
                .eq('student_id', studentData.profile_id);

            if (marksData && marksData.length > 0) {
                let totalObtained = 0;
                let totalMax = 0;

                marksData.forEach((mark: any) => {
                    if (mark.marks_obtained !== null) {
                        totalObtained += mark.marks_obtained;
                        // exam_subjects is usually an object (single relationship)
                        const subjectData: any = mark.exam_subjects;
                        const max = subjectData?.max_marks || 100;
                        totalMax += max;
                    }
                });

                if (totalMax > 0) {
                    const percentage = (totalObtained / totalMax) * 100;
                    let title = '';
                    let sub = '';

                    if (percentage >= 90) {
                        title = 'Excellent Work!';
                        sub = `You have an average of ${percentage.toFixed(1)}%. Outstanding performance!`;
                    } else if (percentage >= 75) {
                        title = 'Great Job!';
                        sub = `You have an average of ${percentage.toFixed(1)}%. Keep up the good work!`;
                    } else if (percentage >= 60) {
                        title = 'Good Effort';
                        sub = `You have an average of ${percentage.toFixed(1)}%. Aim for the top!`;
                    } else {
                        title = 'Needs Improvement';
                        sub = `You have an average of ${percentage.toFixed(1)}%. Let's work harder next time.`;
                    }
                    setPerformance({ title, sub });
                }
            }

        } catch (error) {
            console.error('Home Fetch Error:', error);
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

    const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Student';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.headerGradient}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <View style={styles.headerRow}>
                        <View style={styles.profileSection}>
                            <View style={styles.avatar}>
                                {profile?.avatar_url ? (
                                    <Image
                                        source={{ uri: profile.avatar_url }}
                                        style={{ width: '100%', height: '100%', borderRadius: 24 }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Text style={styles.avatarText}>{firstName[0]}</Text>
                                )}
                            </View>
                            <View>
                                <Text style={styles.greeting}>Hi, {firstName}</Text>
                                <Text style={styles.subGreeting}>{className}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('NoticesList')}>
                            <Bell size={24} color="#fff" />
                            <View style={styles.badge} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                {/* Attendance Card */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.attendanceCard}
                        onPress={() => navigation.navigate('Attendance')}
                    >
                        <View style={styles.attendanceLeft}>
                            <View style={[styles.progressCircle, { borderColor: attendancePct < 75 ? theme.colors.warning : theme.colors.success }]}>
                                <Text style={[styles.progressText, { color: attendancePct < 75 ? theme.colors.warning : theme.colors.success }]}>
                                    {attendancePct}%
                                </Text>
                            </View>
                        </View>
                        <View style={styles.attendanceRight}>
                            <Text style={styles.cardTitle}>Attendance Status</Text>
                            <Text style={styles.cardSub}>
                                {attendancePct >= 75 ? 'You are regular!' : 'Attention Needed'}
                            </Text>
                            <View style={[styles.pill, { backgroundColor: attendanceStatus === 'Present' ? '#ecfdf5' : '#fef2f2' }]}>
                                <Text style={[styles.pillText, { color: attendanceStatus === 'Present' ? theme.colors.success : theme.colors.error }]}>
                                    {attendanceStatus === 'No Data' ? 'Not Marked Yet' : `${attendanceStatus} Today`}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Feature Grid */}
                <Text style={styles.sectionTitle}>Quick Access</Text>
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('HomeworkList')}>
                        <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                            <BookOpen size={24} color="#0284c7" />
                        </View>
                        <Text style={styles.gridLabel}>Homework</Text>
                        <Text style={styles.gridSub}>{pendingHomework} Pending</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ClassTests')}>
                        <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                            <ClipboardList size={24} color="#4338ca" />
                        </View>
                        <Text style={styles.gridLabel}>Class Tests</Text>
                        <Text style={styles.gridSub}>Adjusted</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ExamsList')}>
                        <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                            <GraduationCap size={24} color="#9333ea" />
                        </View>
                        <Text style={styles.gridLabel}>Exam Marks</Text>
                        <Text style={styles.gridSub}>Term Results</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Fees')}>
                        <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                            <IndianRupee size={24} color="#16a34a" />
                        </View>
                        <Text style={styles.gridLabel}>Fees</Text>
                        <Text style={styles.gridSub}>Pay Online</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Attendance')}>
                        <View style={[styles.iconBox, { backgroundColor: '#ffedd5' }]}>
                            <Calendar size={24} color="#ea580c" />
                        </View>
                        <Text style={styles.gridLabel}>Attendance</Text>
                        <Text style={styles.gridSub}>History</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('NoticesList')}>
                        <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                            <FileText size={24} color="#9333ea" />
                        </View>
                        <Text style={styles.gridLabel}>Notices</Text>
                        <Text style={styles.gridSub}>View All</Text>
                    </TouchableOpacity>
                </View>

                {/* Teacher Remarks */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Teacher's Remarks</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('RemarksList')}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {remarks.length > 0 ? (
                    remarks.map((remark) => (
                        <TouchableOpacity key={remark.id} style={styles.remarkCard} onPress={() => navigation.navigate('RemarkDetail', { remarkId: remark.id })}>
                            <View style={styles.remarkHeader}>
                                <Text style={styles.remarkSubject}>
                                    {remark.subject || remark.note_type || 'General'}
                                </Text>
                                <Text style={styles.remarkDate}>
                                    {new Date(remark.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text style={styles.teacherName}>
                                {remark.teacher?.full_name || 'Teacher'}
                            </Text>
                            <Text numberOfLines={2} style={styles.remarkText}>
                                {remark.note_text}
                            </Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No recent remarks.</Text>
                    </View>
                )}

                {/* Performance */}
                <Text style={styles.sectionTitle}>Performance</Text>
                <LinearGradient colors={['#4f46e5', '#4338ca']} style={styles.performanceCard}>
                    <View style={styles.perfContent}>
                        <TrendingUp size={24} color="#fff" style={{ marginBottom: 8 }} />
                        <Text style={styles.perfTitle}>{performance.title}</Text>
                        <Text style={styles.perfSub}>{performance.sub}</Text>
                    </View>
                </LinearGradient>

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
    avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    greeting: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    subGreeting: { color: '#cbd5e1', fontSize: 14 },
    bellBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center', position: 'relative'
    },
    badge: {
        position: 'absolute', top: 10, right: 10, width: 8, height: 8,
        borderRadius: 4, backgroundColor: theme.colors.error, borderWidth: 1, borderColor: theme.colors.primary
    },
    content: { flex: 1, marginTop: -30 },
    scrollContent: { paddingHorizontal: 20 },
    section: { marginBottom: 24 },

    // Attendance Card
    attendanceCard: {
        backgroundColor: '#fff', flexDirection: 'row', padding: 20, borderRadius: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
        alignItems: 'center', marginBottom: 24
    },
    attendanceLeft: { marginRight: 20 },
    progressCircle: {
        width: 70, height: 70, borderRadius: 35, borderWidth: 6, borderColor: theme.colors.success,
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#ecfdf5'
    },
    progressText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.success },
    attendanceRight: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    cardSub: { fontSize: 13, color: '#64748b', marginBottom: 8 },
    pill: {
        backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start'
    },
    pillText: { color: theme.colors.success, fontSize: 12, fontWeight: '600' },

    // Grid
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
    gridItem: {
        width: '47%', backgroundColor: '#fff', padding: 16, borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12
    },
    gridLabel: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
    gridSub: { fontSize: 12, color: '#64748b' },

    // Remarks
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    seeAll: { color: theme.colors.accent, fontWeight: '600' },
    remarkCard: {
        backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12,
        borderLeftWidth: 4, borderLeftColor: theme.colors.accent,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
    },
    remarkHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    remarkSubject: { fontWeight: 'bold', color: '#1e293b', fontSize: 13, backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    remarkDate: { fontSize: 12, color: '#94a3b8' },
    teacherName: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 4 },
    remarkText: { color: '#334155', lineHeight: 20, fontSize: 14 },
    emptyCard: { padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, marginBottom: 24 },
    emptyText: { color: '#94a3b8' },

    // Performance
    performanceCard: { padding: 20, borderRadius: 24, marginBottom: 20 },
    perfContent: {},
    perfTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    perfSub: { color: '#e0e7ff', lineHeight: 20 }
});
