import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Calendar, FileText, CheckCircle } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { useIsFocused } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ClassTestsManagementScreen({ navigation }: any) {
    const { user } = useAuth();
    const isFocused = useIsFocused();
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form
    const [testName, setTestName] = useState('');
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [maxMarks, setMaxMarks] = useState('20');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [isFocused]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [testsRes, teacherRes] = await Promise.all([
                api.get('/exams/class-tests'),
                api.get('/teachers/me')
            ]);
            setTests(testsRes.data);

            // Allow teacher to select from their allocated subjects
            const list = teacherRes.data.subjects?.map((s: any) => ({
                id: s.id,
                subject_id: s.subject_id,
                class_id: s.class_id,
                section_id: s.section_id,
                name: s.subjects.name,
                fullLabel: `${s.subjects.name} (${s.classes.name}-${s.sections.name})`
            })) || [];
            setSubjects(list);

        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!testName || !selectedSubject) {
            Alert.alert('Required', 'Name and Subject are required.');
            return;
        }

        try {
            setCreating(true);
            // 1. Create Exam
            const { data: exam } = await api.post('/exams/class-test', {
                name: testName,
                start_date: format(date, 'yyyy-MM-dd'),
                academic_year_id: 1 // Hardcoded for now, or fetch
            });

            // 2. Add Subject Config
            await api.post('/exams/class-test-subject', {
                exam_id: exam.id,
                subject_id: selectedSubject.subject_id,
                class_id: selectedSubject.class_id,
                max_marks: parseInt(maxMarks),
                pass_marks: Math.ceil(parseInt(maxMarks) * 0.35),
                exam_date: format(date, 'yyyy-MM-dd')
            });

            Alert.alert('Success', 'Class Test Created!');
            setModalVisible(false);
            setTestName('');
            setSelectedSubject(null);
            fetchData();

        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to create test.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Class Tests</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1e293b" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={tests}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No class tests created.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ExamMarks', { presetExam: item })}>
                            <View style={styles.cardHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={styles.iconBox}>
                                        <FileText size={20} color="#8b5cf6" />
                                    </View>
                                    <View>
                                        <Text style={styles.title}>{item.name}</Text>
                                        <Text style={styles.date}>{format(new Date(item.start_date), 'dd MMM yyyy')}</Text>
                                    </View>
                                </View>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>View</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Plus size={24} color="#fff" />
            </TouchableOpacity>

            {/* Create Modal */}
            <Modal visible={modalVisible} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <ArrowLeft size={24} color="#1e293b" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Create Class Test</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.form}>
                        <Text style={styles.label}>Test Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Monday Math Quiz"
                            value={testName}
                            onChangeText={setTestName}
                        />

                        <Text style={styles.label}>Date</Text>
                        <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)}>
                            <Text>{format(date, 'dd MMM yyyy')}</Text>
                            <Calendar size={20} color="#64748b" />
                        </TouchableOpacity>
                        {showPicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                onChange={(e, d) => {
                                    setShowPicker(false);
                                    if (d) setDate(d);
                                }}
                            />
                        )}

                        <Text style={styles.label}>Max Marks</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="20"
                            keyboardType="numeric"
                            value={maxMarks}
                            onChangeText={setMaxMarks}
                        />

                        <Text style={styles.label}>For Subject & Class</Text>
                        {subjects.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                style={[styles.option, selectedSubject === s && styles.optionActive]}
                                onPress={() => setSelectedSubject(s)}
                            >
                                <Text style={[styles.optionText, selectedSubject === s && styles.optionTextActive]}>
                                    {s.fullLabel}
                                </Text>
                                {selectedSubject === s && <CheckCircle size={16} color="#2563eb" />}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.submitBtn, creating && { opacity: 0.7 }]}
                            onPress={handleCreate}
                            disabled={creating}
                        >
                            {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Test</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { backgroundColor: '#1e293b', padding: 20, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
    backBtn: {},
    list: { padding: 16 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    date: { fontSize: 13, color: '#64748b' },
    badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
    fab: {
        position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#111827',
        justifyContent: 'center', alignItems: 'center', elevation: 6
    },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#94a3b8' },
    // Modal
    modalHeader: { padding: 20, borderBottomWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 8, fontSize: 16 },
    dateInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between' },
    option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 },
    optionActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
    optionText: { color: '#1e293b' },
    optionTextActive: { color: '#2563eb', fontWeight: 'bold' },
    submitBtn: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }

});
