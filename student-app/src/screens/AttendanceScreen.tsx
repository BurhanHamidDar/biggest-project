import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, Calendar as CalendarIcon, UserCheck, ArrowLeft } from 'lucide-react-native';

export default function AttendanceScreen({ navigation }: any) {
    const { studentData, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [className, setClassName] = useState('Loading...');

    const fetchAttendance = async () => {
        if (!studentData?.profile_id) {
            setLoading(false);
            return;
        }

        try {
            // Fetch Class & Section Names
            if (studentData.class_id) {
                const { data: classData } = await supabase.from('classes').select('name').eq('id', studentData.class_id).single();
                let sectionName = '';
                if (studentData.section_id) {
                    const { data: sectionData } = await supabase.from('sections').select('name').eq('id', studentData.section_id).single();
                    if (sectionData) sectionName = sectionData.name;
                }
                if (classData) {
                    setClassName(`${classData.name} / Section ${sectionName || 'A'}`);
                }
            } else {
                setClassName('Class Not Assigned');
            }

            // Fetch Attendance Records linked with Registers
            const { data, error } = await supabase
                .from('attendance_records')
                .select(`
                    id,
                    status,
                    remarks,
                    student_id,
                    attendance_registers!inner (
                        date,
                        marked_by,
                        teachers (
                            profiles (full_name)
                        )
                    )
                `)
                .eq('student_id', studentData.profile_id)
                .order('attendance_registers(date)', { ascending: false });

            if (error) throw error;

            console.log('Attendance Raw:', data);

            // Process Data
            const records = data.map((record: any) => ({
                id: record.id,
                date: record.attendance_registers.date,
                status: record.status, // 'present', 'absent', 'late', 'excused'
                markedBy: record.attendance_registers?.teachers?.profiles?.full_name || 'HR Teacher',
                remarks: record.remarks
            }));

            // Calculate Stats
            let present = 0;
            let absent = 0;
            let total = records.length;

            records.forEach(r => {
                if (r.status === 'present' || r.status === 'late' || r.status === 'excused') present++;
                else absent++;
            });

            const percentage = total > 0 ? (present / total) * 100 : 0;

            setStats({ present, absent, total, percentage });
            setAttendanceData(records);

        } catch (error) {
            console.error('Attendance Fetch Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [studentData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAttendance();
    }, []);

    // Create marked dates for calendar
    const markedDates = useMemo(() => {
        const marks: any = {};
        attendanceData.forEach(record => {
            let color = '#cbd5e1'; // Default Grey
            if (record.status === 'present') color = '#22c55e'; // Green
            else if (record.status === 'absent') color = '#ef4444'; // Red
            else if (record.status === 'late') color = '#eab308'; // Yellow

            marks[record.date] = {
                selected: record.date === selectedDate,
                selectedColor: color,
                dotColor: 'transparent',
                customStyles: {
                    container: {
                        backgroundColor: record.date === selectedDate ? theme.colors.primary : color,
                        borderRadius: 8
                    },
                    text: {
                        color: '#fff',
                        fontWeight: 'bold'
                    }
                }
            };
        });

        // Ensure selected date is highlighted even if no data
        if (!marks[selectedDate]) {
            marks[selectedDate] = { selected: true, selectedColor: theme.colors.primary };
        }

        return marks;
    }, [attendanceData, selectedDate]);

    // Get details for selected date
    const selectedRecord = attendanceData.find(r => r.date === selectedDate);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            >
                {/* 1. Header Card */}
                <View style={styles.headerCard}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.studentName}>{profile?.full_name}</Text>
                            <Text style={styles.classInfo}>{className}</Text>
                        </View>
                        <View style={styles.percentBadge}>
                            <Text style={styles.percentText}>{stats.percentage.toFixed(0)}%</Text>
                            <Text style={styles.percentLabel}>Attendance</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                            <Text style={styles.statValue}>{stats.present}</Text>
                            <Text style={styles.statLabel}>Present</Text>
                        </View>
                        <View style={[styles.verticalLine]} />
                        <View style={styles.statItem}>
                            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                            <Text style={styles.statValue}>{stats.absent}</Text>
                            <Text style={styles.statLabel}>Absent</Text>
                        </View>
                        <View style={[styles.verticalLine]} />
                        <View style={styles.statItem}>
                            <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
                            <Text style={styles.statValue}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total Days</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Calendar */}
                <View style={styles.calendarContainer}>
                    <Calendar
                        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                        markedDates={markedDates}
                        theme={{
                            todayTextColor: theme.colors.primary,
                            arrowColor: theme.colors.primary,
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '600',
                        }}
                        markingType={'custom'}
                    />
                </View>

                {/* 3. Selected Date Detail */}
                <View style={styles.detailCard}>
                    <Text style={styles.detailDate}>{format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}</Text>

                    {selectedRecord ? (
                        <View style={styles.recordInfo}>
                            <View style={[styles.statusBadge, {
                                backgroundColor: selectedRecord.status === 'present' ? '#dcfce7' : '#fee2e2'
                            }]}>
                                {selectedRecord.status === 'present' ? <CheckCircle size={16} color="#166534" /> : <XCircle size={16} color="#b91c1c" />}
                                <Text style={[styles.statusText, {
                                    color: selectedRecord.status === 'present' ? '#166534' : '#b91c1c'
                                }]}>{selectedRecord.status.toUpperCase()}</Text>
                            </View>

                            <View style={styles.metaInfo}>
                                <View style={styles.metaRow}>
                                    <UserCheck size={14} color="#64748b" />
                                    <Text style={styles.metaText}>Marked by: {selectedRecord.markedBy}</Text>
                                </View>
                                {selectedRecord.remarks && (
                                    <Text style={styles.remarks}>"{selectedRecord.remarks}"</Text>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No attendance record for this date.</Text>
                        </View>
                    )}
                </View>

                {/* 4. Recent History List */}
                <Text style={styles.sectionTitle}>Recent History</Text>
                <View style={styles.historyList}>
                    {attendanceData.slice(0, 5).map((item) => (
                        <View key={item.id} style={styles.historyItem}>
                            <View style={styles.historyDateBox}>
                                <Text style={styles.historyDay}>{format(new Date(item.date), 'dd')}</Text>
                                <Text style={styles.historyMonth}>{format(new Date(item.date), 'MMM')}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.historyWeekday}>{format(new Date(item.date), 'EEEE')}</Text>
                                <Text style={styles.historyMeta}>Marked by {item.markedBy}</Text>
                            </View>
                            <View style={[styles.miniBadge, {
                                backgroundColor: item.status === 'present' ? '#dcfce7' : '#fee2e2'
                            }]}>
                                <Text style={[styles.miniBadgeText, {
                                    color: item.status === 'present' ? '#166534' : '#b91c1c'
                                }]}>{item.status.toUpperCase()}</Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 40 },

    // Header
    headerCard: {
        backgroundColor: '#0f172a', // Navy Blue
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
    },
    backButton: { marginBottom: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    studentName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    classInfo: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    percentBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    percentText: { fontSize: 20, fontWeight: 'bold', color: '#4ade80' },
    percentLabel: { fontSize: 10, color: '#94a3b8' },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15 },
    statItem: { alignItems: 'center', flex: 1 },
    dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
    statValue: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    statLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
    verticalLine: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

    // Calendar
    calendarContainer: {
        backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 20,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05
    },

    // Detail Card
    detailCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 2 },
    detailDate: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
    recordInfo: { alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 12 },
    statusText: { fontWeight: 'bold', fontSize: 14 },
    metaInfo: { alignItems: 'center' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    metaText: { fontSize: 12, color: '#64748b' },
    remarks: { fontSize: 12, fontStyle: 'italic', color: '#94a3b8', marginTop: 4 },
    emptyState: { alignItems: 'center', padding: 10 },
    emptyText: { color: '#94a3b8', fontStyle: 'italic' },

    // List
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginLeft: 4 },
    historyList: { gap: 12 },
    historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, gap: 12, elevation: 1 },
    historyDateBox: { alignItems: 'center', backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8, width: 50 },
    historyDay: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    historyMonth: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' },
    historyWeekday: { fontSize: 14, fontWeight: '600', color: '#334155' },
    historyMeta: { fontSize: 11, color: '#94a3b8' },
    miniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    miniBadgeText: { fontSize: 10, fontWeight: 'bold' }
});
