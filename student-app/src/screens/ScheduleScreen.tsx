import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, MapPin, User, BookOpen, AlertCircle } from 'lucide-react-native';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { format, getDay, isSameDay, set } from 'date-fns';

const { width } = Dimensions.get('window');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduleScreen() {
    const { studentData } = useAuth();
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [className, setClassName] = useState('Loading...');
    const [sectionName, setSectionName] = useState('');
    const [selectedDay, setSelectedDay] = useState<string>('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Set initial day to today (or Monday if Sunday)
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        if (DAYS.includes(today)) {
            setSelectedDay(today);
        } else {
            setSelectedDay('Monday');
        }

        // Update current time every minute for highlighting
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (studentData?.class_id && studentData?.section_id) {
            fetchSchedule();
        }
    }, [studentData]);

    const fetchSchedule = async () => {
        try {
            // Parallel fetch for class info and schedule
            const [scheduleRes, classRes, sectionRes] = await Promise.all([
                supabase
                    .from('timetable')
                    .select(`
                        *,
                        subject:subjects(name, code),
                        teacher:teachers(
                            profile:profiles(full_name)
                        )
                    `)
                    .eq('class_id', studentData.class_id)
                    .eq('section_id', studentData.section_id)
                    .order('period_number', { ascending: true }),
                supabase.from('classes').select('name').eq('id', studentData.class_id).single(),
                supabase.from('sections').select('name').eq('id', studentData.section_id).single()
            ]);

            if (scheduleRes.error) throw scheduleRes.error;
            setSchedule(scheduleRes.data || []);

            if (classRes.data) setClassName(classRes.data.name);
            if (sectionRes.data) setSectionName(sectionRes.data.name);

        } catch (error) {
            console.error('Error fetching timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSchedule();
        setRefreshing(false);
    };

    const isCurrentPeriod = (start: string, end: string, day: string) => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        if (day !== today) return false;

        const now = currentTime;
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        const startTime = set(now, { hours: startH, minutes: startM, seconds: 0 });
        const endTime = set(now, { hours: endH, minutes: endM, seconds: 0 });

        return now >= startTime && now <= endTime;
    };

    // Filter schedule for selected day
    const daySchedule = schedule.filter(item => item.day === selectedDay);

    const renderDayTab = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[
                styles.dayTab,
                selectedDay === item && styles.dayTabActive
            ]}
            onPress={() => setSelectedDay(item)}
        >
            <Text style={[
                styles.dayTabText,
                selectedDay === item && styles.dayTabTextActive
            ]}>
                {item.slice(0, 3)}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <View style={styles.titleRow}>
                        <Calendar color="#fff" size={24} />
                        <Text style={styles.headerTitle}>Timetable</Text>
                    </View>
                    <Text style={styles.headerSub}>
                        {className} - {sectionName || ''}
                    </Text>
                    {/* Note: In real app, class_id/section_id would be joined names, but studentData usually has IDs. 
                        Ideally fetch names or use context if available. For now IDs or 'Class Schedule' is fine.
                    */}
                </SafeAreaView>

                {/* Day Tabs */}
                <View style={styles.tabContainer}>
                    <FlatList
                        data={DAYS}
                        renderItem={renderDayTab}
                        keyExtractor={item => item}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabList}
                    />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{selectedDay}</Text>
                    <Text style={styles.dayCount}>{daySchedule.length} Periods</Text>
                </View>

                {daySchedule.length > 0 ? (
                    daySchedule.map((period, index) => {
                        const active = isCurrentPeriod(period.start_time, period.end_time, period.day);
                        return (
                            <View key={period.id} style={[styles.card, active && styles.cardActive]}>
                                <View style={styles.timeColumn}>
                                    <Text style={[styles.startTime, active && styles.textActive]}>
                                        {period.start_time.slice(0, 5)}
                                    </Text>
                                    <View style={[styles.timeLine, active && styles.lineActive]} />
                                    <Text style={[styles.endTime, active && styles.textActive]}>
                                        {period.end_time.slice(0, 5)}
                                    </Text>
                                </View>

                                <View style={styles.cardContent}>
                                    {active && (
                                        <View style={styles.activeBadge}>
                                            <Text style={styles.activeText}>NOW</Text>
                                        </View>
                                    )}

                                    <Text style={[styles.subjectName, active && styles.textActive]}>
                                        {period.subject?.name || 'Subject'}
                                    </Text>

                                    <View style={styles.periodMeta}>
                                        <View style={styles.metaItem}>
                                            <User size={14} color={active ? '#fff' : '#64748b'} />
                                            <Text style={[styles.metaText, active && styles.textActive]}>
                                                {period.teacher?.profile?.full_name || 'Teacher'}
                                            </Text>
                                        </View>
                                        {period.room_number && (
                                            <View style={styles.metaItem}>
                                                <MapPin size={14} color={active ? '#fff' : '#64748b'} />
                                                <Text style={[styles.metaText, active && styles.textActive]}>
                                                    Rm {period.room_number}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.periodNumber}>
                                    <Text style={[styles.periodNumberText, active && styles.textActive]}>
                                        {period.period_number}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptyState}>
                        <AlertCircle size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No classes scheduled for {selectedDay}.</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerContent: { paddingHorizontal: 20, paddingBottom: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSub: { fontSize: 14, color: '#e2e8f0', marginLeft: 34 },

    tabContainer: { paddingVertical: 10 },
    tabList: { paddingHorizontal: 20, gap: 12 },
    dayTab: {
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
    },
    dayTabActive: { backgroundColor: '#fff', borderColor: '#fff' },
    dayTabText: { color: '#e2e8f0', fontWeight: '600', fontSize: 14 },
    dayTabTextActive: { color: theme.colors.primary, fontWeight: 'bold' },

    content: { flex: 1, marginTop: 10 },
    scrollContent: { paddingHorizontal: 20 },

    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
    dayTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    dayCount: { fontSize: 14, color: '#64748b' },

    card: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        alignItems: 'center'
    },
    cardActive: { backgroundColor: theme.colors.primary },

    timeColumn: { alignItems: 'center', width: 50, marginRight: 16 },
    startTime: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
    endTime: { fontSize: 13, color: '#64748b' },
    timeLine: { width: 2, height: 20, backgroundColor: '#e2e8f0', marginVertical: 4 },
    lineActive: { backgroundColor: 'rgba(255,255,255,0.3)' },

    cardContent: { flex: 1 },
    subjectName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
    periodMeta: { flexDirection: 'row', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#64748b' },

    periodNumber: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9',
        justifyContent: 'center', alignItems: 'center', marginLeft: 10
    },
    periodNumberText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },

    textActive: { color: '#fff' },

    activeBadge: {
        position: 'absolute', top: -8, right: 0, backgroundColor: '#fff',
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8
    },
    activeText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.primary },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { marginTop: 12, color: '#94a3b8', fontSize: 16 }
});
