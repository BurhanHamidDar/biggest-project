import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function AttendanceManagementScreen({ navigation }: any) {
    const { user } = useAuth();
    const isFocused = useIsFocused();
    const [loading, setLoading] = useState(false);
    const [hrClass, setHrClass] = useState<any>(null);
    const [statusToday, setStatusToday] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [isFocused]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: hrData } = await api.get('/teachers/me');
            const myHr = hrData.hr_classes?.[0];

            if (!myHr) {
                setHrClass(null);
                return;
            }

            setHrClass(myHr);

            const today = format(new Date(), 'yyyy-MM-dd');

            const { data: statusRes } = await api.get('/attendance/status', {
                params: {
                    date: today,
                    class_id: myHr.class_id,
                    section_id: myHr.section_id
                }
            });
            setStatusToday(statusRes);

            const { data: histRes } = await api.get('/attendance/history', {
                params: {
                    class_id: myHr.class_id,
                    section_id: myHr.section_id
                }
            });
            setHistory(histRes);
        } catch (error) {
            console.log('Fetch Attendance Error:', error);
            Alert.alert('Error', 'Failed to load attendance data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
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
                        <Text style={styles.headerTitle}>Attendance Management</Text>
                    </SafeAreaView>
                </LinearGradient>
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            </View>
        );
    }

    if (!hrClass) {
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
                        <Text style={styles.headerTitle}>Attendance Management</Text>
                    </SafeAreaView>
                </LinearGradient>
                <View style={[styles.center, { padding: 32 }]}>
                    <XCircle size={48} color="#94a3b8" />
                    <Text style={styles.errorTitle}>Access Denied</Text>
                    <Text style={styles.errorMsg}>You are not assigned as the HR teacher for any class.</Text>
                </View>
            </View>
        );
    }

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
                    <Text style={styles.headerTitle}>Attendance Management</Text>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.content}>
                {/* Today's Card */}
                <View style={styles.todayCard}>
                    <Text style={styles.cardTitle}>Today's Attendance</Text>
                    <Text style={styles.cardDate}>{format(new Date(), 'EEEE, dd MMM yyyy')}</Text>

                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot,
                        statusToday?.status === 'finalized' ? { backgroundColor: '#10b981' } :
                            statusToday?.status === 'draft' ? { backgroundColor: '#f59e0b' } :
                                { backgroundColor: '#e2e8f0' }
                        ]} />
                        <Text style={styles.statusText}>
                            {statusToday?.status === 'finalized' ? 'Finalized' :
                                statusToday?.status === 'draft' ? 'Draft Saved' : 'Not Started'}
                        </Text>
                    </View>

                    {statusToday?.status === 'finalized' ? (
                        <View style={styles.finalizedBox}>
                            <CheckCircle size={20} color="#166534" />
                            <Text style={styles.finalizedText}>Attendance already finalized.</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('Attendance')}
                        >
                            <Text style={styles.btnText}>Mark Today's Attendance</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* History */}
                <Text style={styles.sectionTitle}>Recent History</Text>
                <FlatList
                    data={history}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.historyItem}
                            onPress={() => navigation.navigate('Attendance', {
                                date: item.date,
                                readOnly: true
                            })}
                        >
                            <View>
                                <Text style={styles.histDate}>{format(new Date(item.date), 'dd MMM yyyy')}</Text>
                                <Text style={styles.histSub}>Class {hrClass.classes?.name}-{hrClass.sections?.name}</Text>
                            </View>
                            <View style={[styles.badge, item.status === 'finalized' ? styles.badgeSuccess : styles.badgeDraft]}>
                                <Text style={styles.badgeText}>{item.status}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
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
    content: { padding: 20, flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
    errorMsg: { textAlign: 'center', color: '#64748b', marginTop: 8 },
    todayCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    cardDate: { color: '#64748b', marginBottom: 16 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    statusText: { fontWeight: '600', color: '#334155' },
    actionBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    finalizedBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', padding: 12, borderRadius: 12, justifyContent: 'center', gap: 8 },
    finalizedText: { color: '#166534', fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
    historyItem: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    histDate: { fontWeight: '600', color: '#1e293b', fontSize: 16 },
    histSub: { fontSize: 12, color: '#94a3b8' },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    badgeSuccess: { backgroundColor: '#dcfce7' },
    badgeDraft: { backgroundColor: '#fef3c7' },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' }
});
