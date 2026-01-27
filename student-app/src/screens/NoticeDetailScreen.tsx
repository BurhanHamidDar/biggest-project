import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { ArrowLeft, FileText, Download, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

export default function NoticeDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { noticeId } = route.params;

    const [notice, setNotice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNoticeDetail();
    }, [noticeId]);

    const fetchNoticeDetail = async () => {
        try {
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .eq('id', noticeId)
                .single();

            if (error) throw error;
            setNotice(data);
            markAsRead();
        } catch (error) {
            console.error('Error fetching notice detail:', error);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check if already read
            const { data: existing } = await supabase
                .from('notice_reads')
                .select('id')
                .eq('notice_id', noticeId)
                .eq('user_id', user.id)
                .single();

            if (!existing) {
                await supabase
                    .from('notice_reads')
                    .insert({
                        notice_id: noticeId,
                        user_id: user.id,
                        read_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error marking notice as read:', error);
        }
    };

    const handleOpenAttachment = async () => {
        if (notice?.attachment_url) {
            const supported = await Linking.canOpenURL(notice.attachment_url);
            if (supported) {
                await Linking.openURL(notice.attachment_url);
            }
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    if (!notice) return null;

    const isHighPriority = notice.importance === 'high' || notice.importance === 'critical';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <LinearGradient colors={['#fff', '#f8fafc']} style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notice Details</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Meta Info */}
                    <View style={styles.metaRow}>
                        <View style={[styles.badge, { backgroundColor: isHighPriority ? '#FEE2E2' : '#DBEAFE' }]}>
                            <Text style={[styles.badgeText, { color: isHighPriority ? '#EF4444' : '#2563EB' }]}>
                                {notice.importance.toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.dateContainer}>
                            <Clock size={14} color="#64748B" />
                            <Text style={styles.dateText}>
                                {format(new Date(notice.created_at), 'PPP')}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{notice.title}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.body}>{notice.content}</Text>

                    {notice.attachment_url && (
                        <TouchableOpacity style={styles.attachmentButton} onPress={handleOpenAttachment}>
                            <View style={styles.attachmentIcon}>
                                <FileText size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.attachmentTitle}>View Attachment</Text>
                                <Text style={styles.attachmentSubtitle}>Tap to open document</Text>
                            </View>
                            <Download size={20} color="#64748B" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { padding: 8, marginLeft: -8, borderRadius: 12, backgroundColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },

    content: { padding: 24 },

    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 14, color: '#64748B' },

    title: { fontSize: 24, fontWeight: '800', color: '#0f172a', lineHeight: 32, marginBottom: 24 },

    divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 24 },

    body: { fontSize: 16, color: '#334155', lineHeight: 28, marginBottom: 32 },

    attachmentButton: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: '#E2E8F0', gap: 16
    },
    attachmentIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
    attachmentTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    attachmentSubtitle: { fontSize: 12, color: '#64748B' }
});
