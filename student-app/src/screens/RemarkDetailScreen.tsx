import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { ArrowLeft, BookOpen, User, Clock, MessageSquare, Quote } from 'lucide-react-native';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

export default function RemarkDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { remarkId } = route.params;

    const [remark, setRemark] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRemarkDetail();
    }, [remarkId]);

    const fetchRemarkDetail = async () => {
        try {
            const { data, error } = await supabase
                .from('student_notes')
                .select(`
                    *,
                    teacher:profiles!student_notes_teacher_id_fkey(full_name)
                `)
                .eq('id', remarkId)
                .single();

            if (error) throw error;
            setRemark(data);
            markAsRead();
        } catch (error) {
            console.error('Error fetching remark detail:', error);
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
                .from('student_note_reads')
                .select('id')
                .eq('note_id', remarkId)
                .eq('student_id', user.id)
                .single();

            if (!existing) {
                await supabase
                    .from('student_note_reads')
                    .insert({
                        note_id: remarkId,
                        student_id: user.id,
                        read_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error marking remark as read:', error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    if (!remark) return null;

    const teacherName = remark.teacher?.full_name || 'Teacher';
    const subject = remark.subject || remark.note_type || 'General';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <LinearGradient colors={['#fff', '#f8fafc']} style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Remark Details</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Meta Info Card */}
                    <View style={styles.metaCard}>
                        <View style={styles.metaRow}>
                            <View style={styles.iconBox}>
                                <BookOpen size={20} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.metaLabel}>Subject</Text>
                                <Text style={styles.metaValue}>{subject}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.metaRow}>
                            <View style={[styles.iconBox, { backgroundColor: '#10B981' }]}>
                                <User size={20} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.metaLabel}>Teacher</Text>
                                <Text style={styles.metaValue}>{teacherName}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.metaRow}>
                            <View style={[styles.iconBox, { backgroundColor: '#F59E0B' }]}>
                                <Clock size={20} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.metaLabel}>Date</Text>
                                <Text style={styles.metaValue}>{format(new Date(remark.created_at), 'PPP p')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Content Section */}
                    <Text style={styles.sectionTitle}>Teacher's Note</Text>
                    <View style={styles.noteContainer}>
                        <Quote size={24} color="#CBD5E1" style={styles.quoteIcon} />
                        <Text style={styles.noteText}>{remark.note_text}</Text>
                    </View>

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

    metaCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    metaLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
    metaValue: { fontSize: 16, fontWeight: '600', color: '#1e293b' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },

    noteContainer: { backgroundColor: '#F8FAFC', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    quoteIcon: { marginBottom: 12 },
    noteText: { fontSize: 16, lineHeight: 28, color: '#334155', fontStyle: 'italic' }
});
