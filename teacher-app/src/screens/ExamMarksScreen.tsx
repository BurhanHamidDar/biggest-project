import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function ExamMarksScreen({ navigation }: any) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Setup Data
    const [exams, setExams] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<any[]>([]);

    // Selection
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [selectedAllocation, setSelectedAllocation] = useState<any>(null);
    const [activeExamSubject, setActiveExamSubject] = useState<any>(null);

    // Entry Data
    const [students, setStudents] = useState<any[]>([]);
    const [marks, setMarks] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [examsRes, teacherRes] = await Promise.all([
                api.get('/exams'),
                api.get('/teachers/me')
            ]);

            setExams(examsRes.data);

            const list = teacherRes.data.subjects?.map((s: any) => ({
                id: s.id, // allocation id
                uniqueKey: `${s.subject_id}-${s.class_id}-${s.section_id}`,
                class_id: s.class_id,
                section_id: s.section_id,
                subject_id: s.subject_id,
                label: `${s.subjects.name} (${s.classes.name}-${s.sections.name})`
            })) || [];

            setAllocations(list);
        } catch (error) {
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const startEntry = async () => {
        if (!selectedExam || !selectedAllocation) {
            Alert.alert('Required', 'Please select Exam and Subject.');
            return;
        }

        try {
            setLoading(true);

            // 1. Check if Exam is Configured for this Class+Subject
            const { data: esData } = await api.get('/exams/subjects', {
                params: {
                    exam_id: selectedExam.id,
                    class_id: selectedAllocation.class_id
                }
            });

            const matchedConfig = esData.find((e: any) => e.subject_id === selectedAllocation.subject_id);

            if (!matchedConfig) {
                Alert.alert('Not Configured', 'This exam is not configured for this subject yet. Contact Admin.');
                setLoading(false);
                return;
            }

            setActiveExamSubject(matchedConfig);

            // 2. Fetch Students
            const { data: studentList } = await api.get('/students', {
                params: {
                    class_id: selectedAllocation.class_id,
                    section_id: selectedAllocation.section_id
                }
            });

            // 3. Fetch Existing Marks
            const { data: existingMarks } = await api.get('/exams/marks', {
                params: { exam_subject_id: matchedConfig.id }
            });

            // Map existing marks
            const markMap: Record<string, string> = {};
            existingMarks.forEach((m: any) => {
                markMap[m.student_id] = String(m.marks_obtained);
            });
            setMarks(markMap);
            setStudents(studentList);
            setStep(2);

        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to initialize entry.');
        } finally {
            setLoading(false);
        }
    };

    const submitMarks = async () => {
        if (!activeExamSubject) return;

        try {
            setLoading(true);
            const marksData = Object.keys(marks).map(sid => ({
                student_id: sid,
                marks_obtained: parseFloat(marks[sid]),
                remarks: ''
            })).filter(m => !isNaN(m.marks_obtained));

            if (marksData.length === 0) {
                Alert.alert('Empty', 'No marks to save.');
                setLoading(false);
                return;
            }

            await api.post('/exams/marks', {
                exam_subject_id: activeExamSubject.id,
                teacher_id: user.id, // For validation
                marks_data: marksData
            });

            Alert.alert('Success', 'Exam marks saved!');
            navigation.goBack();

        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderSetup = () => (
        <ScrollView contentContainerStyle={styles.form}>
            <Text style={styles.label}>Select Exam</Text>
            {exams.map(e => (
                <TouchableOpacity
                    key={e.id}
                    style={[styles.option, selectedExam?.id === e.id && styles.optionActive]}
                    onPress={() => setSelectedExam(e)}
                >
                    <Text style={[styles.optionText, selectedExam?.id === e.id && styles.optionTextActive]}>
                        {e.name}
                    </Text>
                </TouchableOpacity>
            ))}

            <Text style={styles.label}>Select Your Subject</Text>
            {allocations.map((item, idx) => (
                <TouchableOpacity
                    key={idx}
                    style={[styles.option, selectedAllocation === item && styles.optionActive]}
                    onPress={() => setSelectedAllocation(item)}
                >
                    <Text style={[styles.optionText, selectedAllocation === item && styles.optionTextActive]}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.btn} onPress={startEntry}>
                <Text style={styles.btnText}>Start Grading</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderEntry = () => (
        <>
            <View style={styles.infoBar}>
                <Text style={styles.infoTitle}>{selectedExam?.name} • {activeExamSubject?.max_marks} Marks</Text>
                <Text style={styles.infoSub}>{selectedAllocation?.label}</Text>
            </View>
            <FlatList
                data={students}
                keyExtractor={item => item.profile_id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{item.profiles.full_name}</Text>
                            <Text style={styles.roll}>Admission: {item.admission_no}</Text>
                        </View>
                        <TextInput
                            style={styles.markInput}
                            placeholder="0"
                            keyboardType="numeric"
                            maxLength={5}
                            value={marks[item.profile_id] || ''}
                            onChangeText={txt => {
                                if (parseFloat(txt) > activeExamSubject?.max_marks) return;
                                setMarks(prev => ({ ...prev, [item.profile_id]: txt }))
                            }}
                        />
                    </View>
                )}
            />
            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitBtn} onPress={submitMarks}>
                    <Text style={styles.submitText}>Save Results</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Official Exam Marks</Text>
                </SafeAreaView>
            </LinearGradient>

            {loading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} /> : (
                step === 1 ? renderSetup() : renderEntry()
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
    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8, marginTop: 16 },
    option: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
    optionActive: { borderColor: theme.colors.primary, backgroundColor: '#f0f9ff' },
    optionText: { color: '#1e293b' },
    optionTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
    btn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    infoBar: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
    infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    infoSub: { color: '#64748b' },
    list: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
    name: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
    roll: { fontSize: 12, color: '#64748b' },
    markInput: { width: 80, height: 50, backgroundColor: '#f1f5f9', borderRadius: 8, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0' },
    submitBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
