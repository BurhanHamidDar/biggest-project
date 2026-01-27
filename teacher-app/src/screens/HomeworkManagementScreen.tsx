import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Calendar, BookOpen } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function HomeworkManagementScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const isFocused = useIsFocused();
    const [homeworks, setHomeworks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isFocused) {
            fetchHomework();
        }
    }, [isFocused]);

    const fetchHomework = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/homework', {
                params: { teacher_id: user.id }
            });
            setHomeworks(data);
        } catch (error) {
            console.log('Fetch Error:', error);
            Alert.alert('Error', 'Failed to fetch homework history.');
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (dateStr: string) => {
        const due = new Date(dateStr);
        const now = new Date();
        return due < now ? 'Expired' : 'Active';
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <View style={[styles.badge, status === 'Active' ? styles.badgeActive : styles.badgeExpired]}>
            <Text style={[styles.badgeText, status === 'Active' ? styles.textActive : styles.textExpired]}>
                {status}
            </Text>
        </View>
    );

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
                    <Text style={styles.headerTitle}>Homework Management</Text>
                </SafeAreaView>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={homeworks}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No homework posted yet.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            style={({ pressed }) => [
                                styles.card,
                                { opacity: pressed ? 0.7 : 1 }
                            ]}
                            onPress={() => {
                                console.log('Navigating to detail with:', item.title);
                                // Debug confirmation
                                // Alert.alert("Debug", "Clicked: " + item.title);
                                navigation.navigate('HomeworkDetail', { homework: item });
                            }}
                        >
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.subtitle}>
                                        {item.classes?.name}-{item.sections?.name} • {item.subjects?.name}
                                    </Text>
                                </View>
                                <StatusBadge status={getStatus(item.due_date)} />
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={styles.dateRow}>
                                    <Calendar size={14} color="#64748b" />
                                    <Text style={styles.dateText}>Due: {format(new Date(item.due_date), 'dd MMM yyyy')}</Text>
                                </View>
                            </View>
                        </Pressable>
                    )}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('Homework')}
            >
                <Plus size={24} color="#fff" />
            </TouchableOpacity>
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
    list: { padding: 20, paddingBottom: 100 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#64748b' },
    cardFooter: { marginTop: 12, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 12 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 12, color: '#64748b' },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeActive: { backgroundColor: '#dcfce7' },
    badgeExpired: { backgroundColor: '#f1f5f9' },
    badgeText: { fontSize: 11, fontWeight: 'bold' },
    textActive: { color: '#166534' },
    textExpired: { color: '#64748b' },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#94a3b8' }
});
