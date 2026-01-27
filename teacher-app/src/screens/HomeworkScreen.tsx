import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Upload, File as FileIcon, X, Plus, Trash2, ExternalLink } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

import AttachmentViewer from '../components/AttachmentViewer';

export default function HomeworkScreen({ navigation }: any) {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const [mode, setMode] = useState<'list' | 'create'>('list');
    const [loading, setLoading] = useState(false);

    // List Data
    const [history, setHistory] = useState<any[]>([]);

    // Form Data
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [attachment, setAttachment] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Viewer State
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerType, setViewerType] = useState<string | null>(null);
    const [viewerName, setViewerName] = useState<string>('');

    useEffect(() => {
        if (mode === 'list') fetchHistory();
        else fetchDropdowns();
    }, [mode]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/homework', {
                params: { teacher_id: user.id } // Filter by ME
            });
            setHistory(data);
        } catch (error) {
            showAlert({ type: 'error', title: 'Error', message: 'Failed to load history' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            if (classes.length > 0) return; // Cache

            const { data } = await api.get('/teachers/me');

            // Format Classes
            const uniqueClasses = new Map();
            if (data.subjects) {
                data.subjects.forEach((s: any) => {
                    uniqueClasses.set(`${s.class_id}-${s.section_id}`, {
                        id: `${s.class_id}-${s.section_id}`,
                        class_id: s.class_id,
                        section_id: s.section_id,
                        name: `${s.classes.name} - ${s.sections.name}`
                    });
                });
            }
            setClasses(Array.from(uniqueClasses.values()));

            // Format Subjects
            const uniqSub = new Map();
            if (data.subjects) data.subjects.forEach((s: any) =>
                uniqSub.set(s.subject_id, { id: s.subject_id, name: s.subjects.name })
            );
            setSubjects(Array.from(uniqSub.values()));

        } catch (error) {
            console.log(error);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*', 'video/*', 'application/msword'],
                copyToCacheDirectory: true
            });
            if (!result.canceled) setAttachment(result.assets[0]);
        } catch (err) {
            console.log(err);
        }
    };

    const uploadFile = async () => {
        if (!attachment) return null;
        try {
            const fileExt = attachment.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;
            const formData = new FormData();
            formData.append('file', {
                uri: attachment.uri, name: attachment.name, type: attachment.mimeType || 'application/octet-stream'
            } as any);

            const { data, error } = await supabase.storage.from('assignments').upload(filePath, formData);
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('assignments').getPublicUrl(filePath);
            return publicUrl;
        } catch (error: any) {
            throw new Error('Upload failed: ' + error.message);
        }
    };

    const handleSubmit = async () => {
        if (!selectedClass || !selectedSubject || !title || !description) return showAlert({ type: 'error', title: 'Missing Fields', message: 'Please fill all fields.' });
        try {
            setSubmitting(true);
            const url = await uploadFile();
            await api.post('/homework', {
                class_id: selectedClass.class_id,
                section_id: selectedClass.section_id,
                subject_id: selectedSubject,
                teacher_id: user.id,
                title, description,
                due_date: date.toISOString().split('T')[0],
                attachment_url: url
            });
            showAlert({ type: 'success', title: 'Success', message: 'Homework Assigned successfully.' });
            setMode('list');
            // Reset form
            setTitle(''); setDescription(''); setAttachment(null);
        } catch (error: any) {
            showAlert({ type: 'error', title: 'Error', message: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const deleteItem = async (id: string) => {
        try {
            await api.delete(`/homework/${id}`);
            fetchHistory();
        } catch (error) {
            showAlert({ type: 'error', title: 'Error', message: 'Failed to delete' });
        }
    };

    const openAttachment = (url: string, name: string) => {
        setViewerUrl(url);
        setViewerName(name);
        setViewerType(null); // Auto-detect
        setViewerVisible(true);
    };

    // RENDER
    const renderList = () => (
        <View style={{ flex: 1 }}>
            <FlatList
                data={history}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshing={loading}
                onRefresh={fetchHistory}
                ListEmptyComponent={<Text style={styles.empty}>No homework assigned yet.</Text>}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => navigation.navigate('HomeworkDetail', { homework: item })}
                        >
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardSub}>{item.subjects?.name} • {item.classes?.name}-{item.sections?.name}</Text>
                            <Text style={styles.cardDate}>Due: {new Date(item.due_date).toDateString()}</Text>
                            {item.attachment_url && (
                                <Text style={styles.linkText} onPress={() => openAttachment(item.attachment_url, item.title)}>
                                    View Attachment
                                </Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.delBtn}>
                            <Trash2 color="#ef4444" size={20} />
                        </TouchableOpacity>
                    </View>
                )
                }
            />
            < TouchableOpacity style={styles.fab} onPress={() => setMode('create')}>
                <Plus color="#fff" size={24} />
            </TouchableOpacity >
        </View >
    );

    const renderCreate = () => (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.label}>Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {classes.map(c => (
                    <TouchableOpacity key={c.id} onPress={() => setSelectedClass(c)} style={[styles.pill, selectedClass?.id === c.id && styles.pillActive]}>
                        <Text style={[styles.pillText, selectedClass?.id === c.id && styles.pillTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.label}>Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {subjects.map(s => (
                    <TouchableOpacity key={s.id} onPress={() => setSelectedSubject(s.id)} style={[styles.pill, selectedSubject === s.id && styles.pillActive]}>
                        <Text style={[styles.pillText, selectedSubject === s.id && styles.pillTextActive]}>{s.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Topic..." />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.area]} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="Details..." textAlignVertical="top" />

            <Text style={styles.label}>Attachment</Text>
            <TouchableOpacity style={styles.upload} onPress={pickDocument}>
                {attachment ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <FileIcon size={20} color="#1e293b" />
                        <Text style={{ flex: 1 }} numberOfLines={1}>{attachment.name}</Text>
                        <TouchableOpacity onPress={() => setAttachment(null)}><X size={20} color="red" /></TouchableOpacity>
                    </View>
                ) : <Text style={{ color: '#64748b' }}>Tap to upload (PDF, Image, Video)</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Assign</Text>}
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => mode === 'list' ? navigation.goBack() : setMode('list')} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{mode === 'list' ? 'My Homework' : 'New Assignment'}</Text>
                </SafeAreaView>
            </LinearGradient>

            {mode === 'list' ? renderList() : renderCreate()}

            <AttachmentViewer
                visible={viewerVisible}
                url={viewerUrl}
                type={viewerType}
                name={viewerName}
                onClose={() => setViewerVisible(false)}
            />
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
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    cardSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
    cardDate: { color: '#059669', fontSize: 12, marginTop: 4, fontWeight: '600' },
    linkText: { color: theme.colors.primary, fontSize: 12, marginTop: 4, textDecorationLine: 'underline' },
    delBtn: { padding: 10 },

    // Form
    label: { fontWeight: '600', marginBottom: 8, marginTop: 12, color: '#1e293b' },
    pill: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    pillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    pillText: { color: '#64748b' },
    pillTextActive: { color: '#fff' },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    area: { height: 100 },
    upload: { padding: 24, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', backgroundColor: '#f8fafc' },
    submit: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
    submitText: { color: '#fff', fontWeight: 'bold' }
});
