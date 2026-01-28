import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme';
import { ArrowLeft, Download, CheckCircle, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Asset } from 'expo-asset';

export default function ExamResultScreen({ route, navigation }: any) {
    const { examId, examName } = route.params;
    const { studentData, profile } = useAuth();
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resultSummary, setResultSummary] = useState<any>({ totalObtained: 0, totalMax: 0, percentage: 0, grade: 'Pending', result: 'Pending' });
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [classTeacherName, setClassTeacherName] = useState<string | null>(null);

    useEffect(() => {
        fetchResult();
    }, []);

    const fetchResult = async () => {
        if (!studentData?.profile_id) {
            setLoading(false);
            return;
        }

        try {
            // 0. Fetch Class Teacher (HR)
            if (studentData.class_id && studentData.section_id) {
                const { data: ctData } = await supabase
                    .from('class_teachers')
                    .select(`
                        teacher_id,
                        teachers!inner (
                            profiles!inner (full_name)
                        )
                    `)
                    .eq('class_id', studentData.class_id)
                    .eq('section_id', studentData.section_id)
                    .single();

                const ctDataAny: any = ctData;
                if (ctDataAny?.teachers) {
                    const teacher = Array.isArray(ctDataAny.teachers) ? ctDataAny.teachers[0] : ctDataAny.teachers;
                    const profile = Array.isArray(teacher?.profiles) ? teacher.profiles[0] : teacher?.profiles;
                    if (profile?.full_name) {
                        setClassTeacherName(profile.full_name);
                    }
                }
            }

            // 1. Fetch Marks Linked to Exam
            const { data: marksData, error } = await supabase
                .from('marks')
                .select(`
                    *,
                    exam_subjects!inner (
                        max_marks,
                        pass_marks,
                        subjects (name)
                    )
                `)
                .eq('student_id', studentData.profile_id)
                .eq('exam_subjects.exam_id', examId);

            if (error) throw error;

            // 2. Fetch PDF URL
            const { data: sheetData } = await supabase
                .from('student_marksheets')
                .select('file_url')
                .eq('student_id', studentData.profile_id)
                .eq('exam_id', examId)
                .single();

            if (sheetData) setPdfUrl(sheetData.file_url);

            // 3. Process Data
            let totalMax = 0;
            let totalObtained = 0;
            let passCount = 0;
            let failCount = 0;

            const processed = marksData?.map((m: any) => {
                const max = m.exam_subjects?.max_marks || 100;
                const pass = m.exam_subjects?.pass_marks || 35;
                const ob = m.marks_obtained || 0;

                totalMax += max;
                totalObtained += ob;

                const isPass = ob >= pass;
                if (isPass) passCount++; else failCount++;

                return {
                    id: m.id,
                    subject: m.exam_subjects?.subjects?.name || 'Subject',
                    obtained: ob,
                    max: max,
                    grade: m.grade || (isPass ? 'P' : 'F'),
                    status: isPass ? 'Pass' : 'Fail'
                };
            }) || [];

            setMarks(processed);

            const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
            let grade = 'F';
            if (percentage >= 90) grade = 'A+';
            else if (percentage >= 80) grade = 'A';
            else if (percentage >= 70) grade = 'B';
            else if (percentage >= 60) grade = 'C';
            else if (percentage >= 50) grade = 'D';
            else if (percentage >= 35) grade = 'E';

            setResultSummary({
                totalMax,
                totalObtained,
                percentage: percentage.toFixed(2),
                result: failCount === 0 && processed.length > 0 ? 'PASS' : 'FAIL',
                grade: grade
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    const getLogoBase64 = async () => {
        try {
            const asset = Asset.fromModule(require('../../../assets/school_logo.png'));
            const folder = `${FileSystem.cacheDirectory}assets/`;
            const dirInfo = await FileSystem.getInfoAsync(folder);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
            }
            const localUri = `${folder}school_logo.png`;
            if (asset.localUri) {
                await FileSystem.copyAsync({ from: asset.localUri, to: localUri });
            } else {
                await asset.downloadAsync();
                if (asset.localUri) {
                    await FileSystem.copyAsync({ from: asset.localUri, to: localUri });
                }
            }
            const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
            return `data:image/png;base64,${base64}`;
        } catch (e) {
            console.error("Logo load failed", e);
            return null;
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setLoading(true);

            // 1. Prepare Logo
            const logoSrc = await getLogoBase64() || ''; // Fallback to empty string if failed


            // 2. Generate HTML
            const html = `
            <html>
                <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 40px; -webkit-print-color-adjust: exact; }
                    .header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-bottom: 4px solid #1e293b; padding-bottom: 20px; gap: 20px; }
                    .logo { width: 80px; height: 80px; object-fit: contain; }
                    .school-info { text-align: left; }
                    .school-name { font-size: 24px; font-weight: bold; color: #1e293b; margin: 0; text-transform: uppercase; }
                    .tagline { font-size: 14px; font-style: italic; color: #1e293b; margin: 5px 0; font-weight: 600; }
                    .address { font-size: 12px; color: #64748b; margin: 0; }
                    
                    .student-info { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    .info-item { display: flex; flex-direction: column; }
                    .label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; }
                    .value { font-size: 14px; font-weight: bold; color: #1e293b; }

                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { text-align: left; border-bottom: 2px solid #cbd5e1; padding: 10px; font-size: 12px; text-transform: uppercase; color: #1e293b; background: #e2e8f0; }
                    td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .grade-col { font-weight: bold; text-align: center; }
                    .num-col { text-align: center; }

                    .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 40px; page-break-inside: avoid; }
                    .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 5px; }
                    .result-box { text-align: center; margin-top: 20px; padding: 15px; background: ${resultSummary.result === 'PASS' ? '#dcfce7' : '#fee2e2'}; color: ${resultSummary.result === 'PASS' ? '#166534' : '#b91c1c'}; font-weight: bold; border-radius: 4px; border: 1px solid ${resultSummary.result === 'PASS' ? '#86efac' : '#fca5a5'}; }

                    .signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
                    .sig-box { text-align: center; width: 40%; }
                    .sig-name { font-size: 14px; font-weight: bold; margin-bottom: 5px; color: #1e293b; border-bottom: 1px solid #334155; padding-bottom: 5px; display: inline-block; min-width: 150px; }
                    .sig-title { font-size: 12px; color: #64748b; margin-top: 5px; }
                    
                    .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; font-style: italic; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                </style>
                </head>
                <body>
                    <div class="header">
                        ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : '<div style="height:80px; width:80px;"></div>'}
                        <div class="school-info">
                    <h1 class="school-name">Ayesha Ali Academy</h1>
                    <p class="tagline">Above and Ahead</p>
                    <p class="address">Kanipora Kulgam, J&K - 192231</p>
                    </div>
                </div>

                <div class="student-info">
                    <div class="info-grid">
                        <div class="info-item"><span class="label">Student Name</span><span class="value">${profile?.full_name}</span></div>
                        <div class="info-item"><span class="label">Admission No</span><span class="value">${studentData?.admission_no || '-'}</span></div>
                        <div class="info-item"><span class="label">Exam</span><span class="value">${examName}</span></div>
                        <div class="info-item"><span class="label">Session</span><span class="value">2025-2026</span></div>
                    </div>
                </div>

                <table>
                    <thead>
                    <tr>
                        <th style="width: 40%">Subject</th>
                        <th class="num-col">Max Marks</th>
                        <th class="num-col">Obtained</th>
                        <th class="grade-col">Grade</th>
                    </tr>
                    </thead>
                    <tbody>
                    ${marks.map(m => `
                        <tr>
                        <td>${m.subject}</td>
                        <td class="num-col">${m.max}</td>
                        <td class="num-col" style="font-weight: bold">${m.obtained}</td>
                        <td class="grade-col">${m.grade}</td>
                        </tr>
                    `).join('')}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="summary-row"><span>Total Marks</span><strong>${resultSummary.totalObtained} / ${resultSummary.totalMax}</strong></div>
                    <div class="summary-row"><span>Percentage</span><strong>${resultSummary.percentage}%</strong></div>
                    <div class="result-box">RESULT: ${resultSummary.result} (${resultSummary.grade})</div>
                </div>

                <div class="signatures">
                    <div class="sig-box">
                    <div class="sig-name">${classTeacherName || 'Class Teacher'}</div>
                    <div class="sig-title">Class Teacher</div>
                    </div>
                    <div class="sig-box">
                    <div class="sig-name">Mr. Umer Sherrif</div>
                    <div class="sig-title">Principal</div>
                    </div>
                </div>

                <div class="footer">This is a computer-generated marksheet. Generated on ${new Date().toDateString()}.</div>
                </body>
            </html>
            `;

            // 3. Print to File
            const { uri } = await Print.printToFileAsync({ html, base64: false });

            // 4. Share
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error: any) {
            Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Official Result</Text>
                <TouchableOpacity onPress={handleDownloadPDF} style={{ opacity: 1 }}>
                    <Download color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Official Report Card Container */}
                <View style={styles.reportCard}>

                    {/* 1. School Header */}
                    <View style={styles.schoolHeader}>
                        <Image
                            source={require('../../../assets/school_logo.png')}
                            style={styles.schoolLogo}
                            resizeMode="contain"
                        />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.schoolName}>Ayesha Ali Academy</Text>
                            <Text style={styles.schoolTagline}>Above and Ahead</Text>
                            <Text style={styles.schoolAddress}>Kanipora Kulgam, J&K - 192231</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* 2. Student Info Grid */}
                    <View style={styles.studentInfoGrid}>
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Student Name</Text>
                            <Text style={styles.value}>{profile?.full_name}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Admission No</Text>
                            <Text style={styles.value}>{studentData?.admission_no || '-'}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Exam</Text>
                            <Text style={styles.value}>{examName}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Session</Text>
                            <Text style={styles.value}>2025-2026</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* 3. Expected Marks Table */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, { flex: 2, textAlign: 'left' }]}>Subject</Text>
                        <Text style={[styles.th, { flex: 1 }]}>Max</Text>
                        <Text style={[styles.th, { flex: 1 }]}>Obt</Text>
                        <Text style={[styles.th, { flex: 1 }]}>Grade</Text>
                    </View>

                    {marks.map((item, index) => (
                        <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.rowAlt]}>
                            <Text style={[styles.td, { flex: 2, textAlign: 'left', fontWeight: '500' }]}>{item.subject}</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{item.max}</Text>
                            <Text style={[styles.td, { flex: 1, fontWeight: 'bold' }]}>{item.obtained}</Text>
                            <Text style={[styles.td, { flex: 1 }]}>{item.grade}</Text>
                        </View>
                    ))}

                    <View style={styles.divider} />

                    {/* 4. Footer Summary */}
                    <View style={styles.summarySection}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Marks:</Text>
                            <Text style={styles.summaryValue}>{resultSummary?.totalObtained} / {resultSummary?.totalMax}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Percentage:</Text>
                            <Text style={styles.summaryValue}>{resultSummary?.percentage}%</Text>
                        </View>
                        <View style={[styles.resultBadge, { backgroundColor: resultSummary?.result === 'PASS' ? '#dcfce7' : '#fee2e2' }]}>
                            <Text style={[styles.resultText, { color: resultSummary?.result === 'PASS' ? '#166534' : '#b91c1c' }]}>
                                RESULT: {resultSummary?.result} ({resultSummary?.grade})
                            </Text>
                        </View>
                        {/* 4. Action Buttons (PDF) - Always allow generation now */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadPDF}>
                                <Share2 size={20} color="#fff" />
                                <Text style={styles.btnText}>Share Marksheet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 5. Signature Area */}
                    {/* 5. Signature Area */}
                    <View style={styles.signatureArea}>
                        <View style={styles.sigBox}>
                            <View style={styles.sigLine} />
                            <Text style={styles.sigName}>{classTeacherName || 'Class Teacher'}</Text>
                            <Text style={styles.sigLabel}>Class Teacher</Text>
                        </View>
                        <View style={styles.sigBox}>
                            <View style={styles.sigLine} />
                            <Text style={styles.sigName}>Mr. Umer Sherrif</Text>
                            <Text style={styles.sigLabel}>Principal</Text>
                        </View>
                    </View>

                </View>

                <View style={styles.footerNote}>
                    <Text style={styles.noteText}>This is a computer-generated marksheet.</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: theme.colors.primary, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        elevation: 4
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 4 },
    content: { padding: 16, paddingBottom: 40 },

    reportCard: {
        backgroundColor: '#fff', borderRadius: 0, padding: 0, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
        borderWidth: 1, borderColor: '#e2e8f0'
    },

    // School Header
    schoolHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    schoolLogo: { width: 80, height: 80, marginRight: 16 },
    headerTextContainer: { flex: 1, justifyContent: 'center' },
    schoolName: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', flexWrap: 'wrap', marginBottom: 2 },
    schoolTagline: { fontSize: 13, fontStyle: 'italic', fontWeight: '600', color: theme.colors.primary, marginBottom: 2 },
    schoolAddress: { fontSize: 11, color: '#64748b' },

    divider: { height: 1, backgroundColor: '#cbd5e1', marginVertical: 0 },

    // Student Info
    studentInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, backgroundColor: '#f8fafc' },
    infoCol: { width: '50%', marginBottom: 12 },
    label: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' },
    value: { fontSize: 14, color: '#334155', fontWeight: '600' },

    // Table
    tableHeader: { flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 12, borderTopWidth: 1, borderTopColor: '#cbd5e1', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
    th: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', textTransform: 'uppercase' },

    tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
    rowAlt: { backgroundColor: '#f8fafc' },
    td: { fontSize: 13, color: '#334155', textAlign: 'center' },

    // Summary
    summarySection: { padding: 20, alignItems: 'center', backgroundColor: '#f8fafc' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
    summaryLabel: { fontSize: 14, color: '#64748b' },
    summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },

    resultBadge: { marginTop: 16, paddingHorizontal: 32, paddingVertical: 8, borderRadius: 4, borderWidth: 1, borderColor: 'transparent' },
    resultText: { fontSize: 16, fontWeight: 'bold' },

    actionRow: { marginTop: 20, alignItems: 'center' },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, gap: 8 },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    // Signature Area
    signatureArea: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, paddingTop: 20 },
    sigBox: { alignItems: 'center', width: '40%' },
    sigLine: { height: 1, backgroundColor: '#334155', width: '100%', marginBottom: 8 },
    sigName: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginBottom: 2, textAlign: 'center' },
    sigLabel: { fontSize: 11, color: '#64748b' },

    footerNote: { padding: 20, alignItems: 'center' },
    noteText: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }
});
