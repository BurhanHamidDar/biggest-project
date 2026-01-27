import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, FileText, Clock, AlertTriangle, CheckCircle, Info, X, Banknote } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function InboxScreen() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'notice' | 'alert'>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        fetchInbox();
    }, []);

    // Refresh when tab focused
    useFocusEffect(
        useCallback(() => {
            fetchInbox();
        }, [])
    );

    const fetchInbox = async () => {
        try {
            const { data } = await api.get('/inbox');
            setMessages(data);
        } catch (error) {
            console.log('Inbox Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (msg: any) => {
        if (msg.is_read) return;
        try {
            await api.patch(`/inbox/${msg.id}/read`);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
        } catch (error) {
            console.log('Mark Read Error:', error);
        }
    };

    const openMessage = (msg: any) => {
        setSelectedMessage(msg);
        markAsRead(msg);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'notice': return <FileText size={20} color="#3b82f6" />;
            case 'attendance': return <Clock size={20} color="#f59e0b" />;
            case 'marks': return <CheckCircle size={20} color="#4f46e5" />;
            case 'fee': return <Banknote size={20} color="#16a34a" />;
            case 'system': return <AlertTriangle size={20} color="#ef4444" />;
            default: return <Info size={20} color="#64748b" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'notice': return '#dbeafe';
            case 'attendance': return '#fef3c7';
            case 'marks': return '#e0e7ff';
            case 'fee': return '#dcfce7';
            case 'system': return '#fee2e2';
            default: return '#f1f5f9';
        }
    };

    const filteredMessages = messages.filter(m => {
        if (filter === 'all') return true;
        if (filter === 'notice') return m.type === 'notice';
        if (filter === 'alert') return ['attendance', 'marks', 'fee', 'system'].includes(m.type);
        return true;
    });

    const TabButton = ({ title, active, onPress }: any) => (
        <TouchableOpacity
            style={[styles.tab, active && styles.activeTab]}
            onPress={onPress}
        >
            <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.card, !item.is_read && styles.unreadCard]}
            onPress={() => openMessage(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: getBgColor(item.type) }]}>
                    {getIcon(item.type)}
                    <Text style={[styles.typeText, { color: '#64748b', marginLeft: 8 }]}>
                        {item.type.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.time}>
                    {format(new Date(item.created_at), 'MMM dd')}
                </Text>
            </View>

            <Text style={[styles.title, !item.is_read && styles.boldTitle]} numberOfLines={1}>
                {item.title}
            </Text>

            <Text style={styles.preview} numberOfLines={1}>
                {item.message}
            </Text>

            {!item.is_read && <View style={styles.dot} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Gradient Header */}
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={{ paddingBottom: 20 }}>
                    <Text style={styles.headerTitle}>Inbox</Text>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.tabsContainer}>
                <TabButton title="All" active={filter === 'all'} onPress={() => setFilter('all')} />
                <TabButton title="Notices" active={filter === 'notice'} onPress={() => setFilter('notice')} />
                <TabButton title="System" active={filter === 'alert'} onPress={() => setFilter('alert')} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filteredMessages}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInbox(); }} tintColor={theme.colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Bell size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No new messages</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={!!selectedMessage}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedMessage(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.modalIconBox, { backgroundColor: selectedMessage ? getBgColor(selectedMessage.type) : '#f1f5f9' }]}>
                                {selectedMessage && getIcon(selectedMessage.type)}
                            </View>
                            <TouchableOpacity onPress={() => setSelectedMessage(null)} style={styles.closeIcon}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalBody}>
                            <Text style={styles.modalTypeLabel}>{selectedMessage?.type.toUpperCase()}</Text>
                            <Text style={styles.modalTitle}>{selectedMessage?.title}</Text>
                            <Text style={styles.modalDate}>
                                {selectedMessage && format(new Date(selectedMessage.created_at), 'EEEE, MMMM dd, yyyy • h:mm a')}
                            </Text>
                            <View style={styles.divider} />
                            <Text style={styles.modalMessage}>{selectedMessage?.message}</Text>
                        </ScrollView>

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMessage(null)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        paddingHorizontal: 24,
        paddingTop: 0,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 8,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },

    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 16,
        marginBottom: 8,
        gap: 12
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
    },
    activeTab: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
    activeTabText: { color: '#fff' },

    list: { padding: 24, paddingTop: 8 },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: '#1e293b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
        borderWidth: 1, borderColor: '#f1f5f9',
        position: 'relative'
    },
    unreadCard: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    iconBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    typeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    time: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

    title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    boldTitle: { fontWeight: '800' },
    preview: { fontSize: 13, color: '#64748b' },
    dot: { position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accent },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, color: '#94a3b8', fontSize: 16 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%', padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    closeIcon: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },

    modalTypeLabel: { color: theme.colors.primary, fontWeight: '700', fontSize: 13, letterSpacing: 1, marginBottom: 8 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
    modalDate: { fontSize: 14, color: '#64748b', marginBottom: 24 },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 24 },
    modalBody: { flex: 1 },
    modalMessage: { fontSize: 16, color: '#334155', lineHeight: 26 },

    closeBtn: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 },
    closeBtnText: { color: '#1e293b', fontWeight: 'bold' }
});
