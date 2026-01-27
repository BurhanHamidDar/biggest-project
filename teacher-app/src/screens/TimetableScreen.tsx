import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetableScreen({ navigation }: any) {
    const { user } = useAuth();
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState<string>(DAYS[new Date().getDay() - 1] || 'Monday');

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const { data } = await api.get('/timetable', {
                params: { teacher_id: user.id }
            });
            setTimetable(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    const daySchedule = timetable.filter(item => item.day === activeDay).sort((a, b) => a.period_number - b.period_number);

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
                    <Text style={styles.headerTitle}>My Timetable</Text>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
                    {DAYS.map(day => (
                        <TouchableOpacity
                            key={day}
                            style={[styles.tab, activeDay === day && styles.tabActive]}
                            onPress={() => setActiveDay(day)}
                        >
                            <Text style={[styles.tabText, activeDay === day && styles.tabTextActive]}>{day.substring(0, 3)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} /> : (
                <FlatList
                    data={daySchedule}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No classes scheduled for {activeDay}.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.timeCol}>
                                <Text style={styles.periodNum}>P{item.period_number}</Text>
                                <Text style={styles.timeText}>{item.start_time.substring(0, 5)}</Text>
                                <Text style={styles.timeText}>|</Text>
                                <Text style={styles.timeText}>{item.end_time.substring(0, 5)}</Text>
                            </View>
                            <View style={styles.infoCol}>
                                <Text style={styles.subjectName}>{item.subjects?.name || 'Subject'}</Text>
                                <Text style={styles.className}>{item.classes?.name} - {item.sections?.name}</Text>
                                {item.room_number && (
                                    <View style={styles.row}>
                                        <MapPin size={14} color="#64748b" />
                                        <Text style={styles.roomText}>Room {item.room_number}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
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
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    tabsContainer: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' },
    tabs: { paddingHorizontal: 16, gap: 8 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f5f9' },
    tabActive: { backgroundColor: theme.colors.primary },
    tabText: { color: '#64748b', fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    list: { padding: 16 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    timeCol: { alignItems: 'center', marginRight: 16, borderRightWidth: 1, borderColor: '#e2e8f0', paddingRight: 16 },
    periodNum: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
    timeText: { fontSize: 12, color: '#64748b' },
    infoCol: { flex: 1, justifyContent: 'center' },
    subjectName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    className: { fontSize: 16, color: '#64748b', marginTop: 4 },
    row: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
    roomText: { color: '#64748b', fontSize: 12 }
});
