import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Check, Lock, Plus, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function ClassMarksScreen({ navigation }: any) {
    const { user } = useAuth();

    // Mode: 'list' | 'create' | 'edit'
    const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
    const [loading, setLoading] = useState(false);

    // Data
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Editor State
    const [activeTest, setActiveTest] = useState<any>(null); // For edit mode
    const [testTitle, setTestTitle] = useState('');
    const [maxMarks, setMaxMarks] = useState('20');
    const [students, setStudents] = useState<any[]>([]);
    const [marks, setMarks] = useState<Record<string, string>>({}); // student_id -> marks

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/teachers/me');
            const subList = data.subjects || [];

            // Format unique subjects
            // Teacher might teach same subject to multiple sections.
            // We need to let them select "Class 10A - Math"
            const unique = subList.map((s: any) => ({
                id: s.id, // allocation id
                label: `${s.subjects.name} (${s.classes.name}-${s.sections.name})`,
                class_id: s.class_id,
                section_id: s.section_id,
                subject_id: s.subject_id
            }));

            setSubjects(unique);
            if (unique.length > 0) selectSubject(unique[0]);
            else setLoading(false);

        } catch (error) {
            Alert.alert('Error', 'Failed to load subjects');
            setLoading(false);
        }
    };

    const selectSubject = async (subject: any) => {
        setSelectedSubject(subject);
        setMode('list');
        fetchHistory(subject);
    };

    const fetchHistory = async (subject: any) => {
        try {
            setLoading(true);
            const { data } = await api.get('/marks', {
                params: {
                    class_id: subject.class_id,
                    section_id: subject.section_id,
                    subject_id: subject.subject_id
                }
            });
            setHistory(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startCreate = async () => {
        setTestTitle('');
        setMaxMarks('20');
        setMarks({});
        setMode('create');
        await loadStudents();
    };

    const openTest = async (test: any) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/marks/${test.id}`);

            setActiveTest(data.test);
            setTestTitle(data.test.title);
            setMaxMarks(String(data.test.max_marks));

            // Map marks
            const m: any = {};
            data.marks.forEach((x: any) => m[x.student_id] = String(x.marks_obtained));
            setMarks(m);

            await loadStudents(); // To get names/roll nos

            setMode('edit');
        } catch (error) {
            Alert.alert('Error', 'Failed to open test');
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            const { data } = await api.get('/students', {
                params: {
                    class_id: selectedSubject.class_id,
                    section_id: selectedSubject.section_id
                }
            });
            setStudents(data);
        } catch (error) {
            console.error(error);
        }
    };

    const saveTest = async (finalize = false) => {
        try {
            setLoading(true);

            const records = students.map(s => ({
                student_id: s.profile_id,
                marks_obtained: parseFloat(marks[s.profile_id]) || 0
            }));

            if (mode === 'create') {
                await api.post('/marks', {
                    class_id: selectedSubject.class_id,
                    section_id: selectedSubject.section_id,
                    subject_id: selectedSubject.subject_id,
                    teacher_id: user.id,
                    title: testTitle,
                    max_marks: parseFloat(maxMarks),
                    records
                    // status defaults to draft in backend
                });
                if (finalize) {
                    // Two-step? No, create as draft then immediately update? 
                    // Backend create only supports draft.
                    // If user wants finalize immediately, we must call update after create.
                    // Or keep it simple: "Saved as Draft". User must open to finalize.
                    // Let's keep it simple for now.
                    Alert.alert('Saved', 'Test created as Draft. Open it to Finalize.');
                } else {
                    Alert.alert('Success', 'Test Draft Created');
                }
            } else {
                // Update
                await api.put(`/marks/${activeTest.id}`, {
                    records,
                    finalize
                });
                Alert.alert('Success', finalize ? 'Test Finalized!' : 'Draft Updated');
            }

            // Return to list
            setMode('list');
            fetchHistory(selectedSubject);

        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const confirmFinalize = () => {
        Alert.alert(
            'Finalize Test?',
            'Once finalized, marks cannot be changed.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Finalize', onPress: () => saveTest(true) }
            ]
        );
    };

    // --- RENDER ---

    const renderHeader = () => (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.header}
        >
            <SafeAreaView edges={['top']} style={styles.headerContent}>
                <TouchableOpacity onPress={() => mode === 'list' ? navigation.goBack() : setMode('list')} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Class Marks</Text>
                    <Text style={styles.headerSubtitle}>{selectedSubject?.label || 'Select Subject'}</Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );

    const renderList = () => (
        <View style={{ flex: 1 }}>
            {/* Subject Selector Horizontal Scroll if multiple */}
            {subjects.length > 1 && (
                <View style={styles.subScroll}>
                    <FlatList
                        horizontal showsHorizontalScrollIndicator={false}
                        data={subjects}
                        keyExtractor={i => i.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => selectSubject(item)}
                                style={[styles.chip, selectedSubject?.id === item.id && styles.chipActive]}
                            >
                                <Text style={[styles.chipText, selectedSubject?.id === item.id && styles.chipTextActive]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            <FlatList
                data={history}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListFooterComponent={<View style={{ height: 100 }} />}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: '#94a3b8' }}>No tests found.</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.historyCard} onPress={() => openTest(item)}>
                        <View>
                            <Text style={styles.testTitle}>{item.title}</Text>
                            <Text style={styles.testDate}>{new Date(item.test_date).toDateString()}</Text>
                        </View>
                        <View style={[styles.badge, item.status === 'finalized' ? styles.badgeFinal : styles.badgeDraft]}>
                            <Text style={[styles.badgeText, { color: item.status === 'finalized' ? '#15803d' : '#b45309' }]}>
                                {item.status.toUpperCase()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity style={styles.fab} onPress={startCreate}>
                <Plus color="#fff" size={24} />
            </TouchableOpacity>
        </View>
    );

    const renderEditor = () => {
        const isLocked = activeTest?.status === 'finalized'; // Careful: activeTest is null in create mode

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.formParams}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Test Title</Text>
                        <TextInput
                            style={[styles.input, isLocked && styles.inputLocked]}
                            value={testTitle}
                            onChangeText={setTestTitle}
                            placeholder="e.g. Weekly Quiz 1"
                            editable={!isLocked}
                        />
                    </View>
                    <View style={{ width: 80 }}>
                        <Text style={styles.label}>Max Marks</Text>
                        <TextInput
                            style={[styles.input, isLocked && styles.inputLocked]}
                            value={maxMarks}
                            onChangeText={setMaxMarks}
                            keyboardType="numeric"
                            editable={!isLocked}
                        />
                    </View>
                </View>

                {isLocked && (
                    <View style={styles.lockedBanner}>
                        <Lock size={16} color="#c2410c" />
                        <Text style={styles.lockedText}>This test is finalized. Read-only.</Text>
                    </View>
                )}

                <FlatList
                    data={students}
                    keyExtractor={item => item.profile_id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.studentRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.studentName}>{item.profiles.full_name}</Text>
                                <Text style={styles.roll}>Roll: {item.roll_no}</Text>
                            </View>
                            <TextInput
                                style={[styles.markInput, isLocked && styles.markInputLocked]}
                                value={marks[item.profile_id] || ''}
                                onChangeText={t => {
                                    if (parseFloat(t) > parseFloat(maxMarks)) return;
                                    setMarks(prev => ({ ...prev, [item.profile_id]: t }))
                                }}
                                keyboardType="numeric"
                                placeholder="-"
                                editable={!isLocked}
                            />
                        </View>
                    )}
                />

                {!isLocked && (
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.draftBtn} onPress={() => saveTest(false)}>
                            <Text style={styles.draftText}>Save Draft</Text>
                        </TouchableOpacity>
                        {(mode === 'edit') && (
                            <TouchableOpacity style={styles.finalBtn} onPress={confirmFinalize}>
                                <Text style={styles.finalText}>Finalize</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            {loading ? <ActivityIndicator size="large" color="#1e293b" style={{ marginTop: 50 }} /> : (
                mode === 'list' ? renderList() : renderEditor()
            )}
        </SafeAreaView>
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
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        marginRight: 16
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    headerSubtitle: { color: '#cbd5e1', fontSize: 12 },

    // List Mode
    subScroll: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' },
    chip: { paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20, backgroundColor: '#f1f5f9' },
    chipActive: { backgroundColor: '#1e293b' },
    chipText: { color: '#64748b' },
    chipTextActive: { color: '#fff' },

    historyCard: { backgroundColor: '#fff', padding: 16, marginBottom: 8, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
    testTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    testDate: { fontSize: 12, color: '#64748b' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeDraft: { backgroundColor: '#fef3c7' },
    badgeFinal: { backgroundColor: '#dcfce7' },
    badgeText: { fontSize: 10, fontWeight: 'bold' },

    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', elevation: 4 },
    list: { padding: 16, paddingBottom: 100 },

    // Editor
    formParams: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', marginBottom: 8 },
    label: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    input: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, color: '#1e293b', fontWeight: 'bold' },
    inputLocked: { backgroundColor: '#f8fafc', color: '#94a3b8' },

    lockedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ed', padding: 8, gap: 8 },
    lockedText: { color: '#c2410c', fontSize: 12, fontWeight: 'bold' },

    studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 12 },
    studentName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    roll: { fontSize: 10, color: '#64748b' },
    markInput: { width: 60, height: 40, backgroundColor: '#f1f5f9', borderRadius: 8, textAlign: 'center', fontWeight: 'bold', color: '#1e293b' },
    markInputLocked: { backgroundColor: '#fff', color: '#64748b' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', gap: 12 },
    draftBtn: { flex: 1, backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center' },
    draftText: { color: '#334155', fontWeight: 'bold' },
    finalBtn: { flex: 1, backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center' },
    finalText: { color: '#fff', fontWeight: 'bold' }
});
