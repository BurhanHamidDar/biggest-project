import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { CheckCircle, Clock, AlertTriangle, Lock, Unlock, TrendingUp, DollarSign, Share2, FileText } from 'lucide-react-native';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

export default function FeesScreen() {
    const { studentData, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, status: 'PENDING' });
    const [feeRecords, setFeeRecords] = useState<any[]>([]);
    const [classDetails, setClassDetails] = useState({ className: '', sectionName: '' });
    const [filter, setFilter] = useState('ALL'); // ALL, PAID, PENDING
    const [logoBase64, setLogoBase64] = useState<string | null>(null);

    // Preload logo on mount
    useEffect(() => {
        loadLogoOnce();
    }, []);

    const loadLogoOnce = async () => {
        const base64 = await getLogoBase64();
        if (base64) setLogoBase64(base64);
    };

    const fetchFees = async () => {
        if (!studentData?.class_id || !studentData?.profile_id) {
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch Class Fee Structures
            const { data: structures, error: structError } = await supabase
                .from('class_fee_structures')
                .select(`
                    id,
                    amount,
                    due_date,
                    fee_types (name)
                `)
                .eq('class_id', studentData.class_id);

            if (structError) throw structError;

            // 1.5 Fetch Class & Section Details
            const { data: classData } = await supabase
                .from('classes')
                .select('name')
                .eq('id', studentData.class_id)
                .single();

            const { data: sectionData } = await supabase
                .from('sections')
                .select('name')
                .eq('id', studentData.section_id)
                .single();

            setClassDetails({
                className: classData?.name || 'Class',
                sectionName: sectionData?.name || 'A'
            });

            // 2. Fetch Student Payments
            const { data: payments, error: payError } = await supabase
                .from('student_fee_payments')
                .select('*')
                .eq('student_id', studentData.profile_id);

            if (payError) throw payError;

            // 3. Process & Merge
            let totalDue = 0;
            let totalPaid = 0;
            const records: any[] = [];

            structures?.forEach((struct: any) => {
                const payment = payments?.find(p => p.class_fee_structure_id === struct.id);
                const paidAmount = payment?.amount_paid || 0;
                const isPaid = paidAmount >= struct.amount;

                totalDue += struct.amount;
                totalPaid += paidAmount;

                records.push({
                    id: struct.id,
                    title: struct.fee_types?.name || 'Fee',
                    amount: struct.amount,
                    paid: paidAmount,
                    status: isPaid ? 'PAID' : 'UNPAID',
                    dueDate: struct.due_date,
                    paymentDate: payment?.payment_date,
                    transactionId: payment?.transaction_id,
                    markedBy: payment ? 'HR Admin' : '-',
                });
            });

            setStats({
                total: totalDue,
                paid: totalPaid,
                pending: Math.max(0, totalDue - totalPaid),
                status: totalPaid >= totalDue ? 'CLEARED' : 'PENDING'
            });

            setFeeRecords(records);

        } catch (error) {
            console.error('Fees Fetch Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFees();
    }, [studentData]);

    const getLogoBase64 = async () => {
        try {
            // Safe asset loading for standalone apps
            const asset = Asset.fromModule(require('../../assets/school_logo.png'));
            await asset.downloadAsync(); // Ensure it's downloaded

            if (!asset.localUri) {
                console.log("No local URI for asset");
                return null;
            }

            const folder = `${FileSystem.cacheDirectory}assets/`;
            const dirInfo = await FileSystem.getInfoAsync(folder);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
            }

            const localUri = `${folder}school_logo.png`;

            // Check if file already exists to avoid redundant copy
            const fileInfo = await FileSystem.getInfoAsync(localUri);
            if (!fileInfo.exists) {
                await FileSystem.copyAsync({ from: asset.localUri, to: localUri });
            }

            const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
            return `data:image/png;base64,${base64}`;
        } catch (e) {
            console.error("Logo load failed", e);
            return null; // Fallback to no logo
        }
    };

    const generatePDF = async (items: any[], isStatement = false) => {
        try {
            setLoading(true);
            const logoSrc = logoBase64 || await getLogoBase64(); // Use state or fetch
            const logoHtml = logoSrc ? `<img src="${logoSrc}" class="logo" />` : '<div style="height:60px;"></div>';

            const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
            const totalPaid = items.reduce((sum, item) => sum + item.paid, 0);
            const totalPending = Math.max(0, totalAmount - totalPaid);

            const rowsHtml = items.map(item => `
                <tr>
                    <td>${item.title}</td>
                    <td style="text-align: right;">Rs.${item.amount}</td>
                    <td style="text-align: right;">${item.status}</td>
                </tr>
            `).join('');

            const title = isStatement ? 'FEE STATEMENT' : 'FEE RECEIPT';
            const dateStr = format(new Date(), 'dd MMM yyyy');

            const html = `
            <html>
                <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #1e293b; }
                    .container { border: 2px solid #1e293b; padding: 20px; position: relative; }
                    .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 15px; margin-bottom: 20px; }
                    .logo { width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px; }
                    .school-name { font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0; }
                    .tagline { font-size: 12px; font-style: italic; margin: 5px 0; }
                    .address { font-size: 10px; color: #64748b; }
                    
                    .receipt-title { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
                    
                    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
                    .detail-item { font-size: 12px; }
                    .label { font-weight: bold; color: #475569; display: block; }
                    .value { font-weight: 600; color: #0f172a; }

                    .payment-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .payment-table th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 12px; border: 1px solid #e2e8f0; }
                    .payment-table td { padding: 8px; font-size: 12px; border: 1px solid #e2e8f0; }
                    .total-row td { font-weight: bold; background: #f8fafc; }

                    .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .sig-box { text-align: center; }
                    .sig-line { border-bottom: 1px solid #000; width: 120px; margin-bottom: 5px; }
                    .sig-text { font-size: 10px; font-weight: bold; }
                </style>
                </head>
                <body>
                <div class="container">
                    <div class="header">
                        ${logoHtml}
                        <h1 class="school-name">Ayesha Ali Academy</h1>
                        <p class="tagline">Above and Ahead</p>
                        <p class="address">Kanipora Kulgam, J&K - 192231</p>
                    </div>

                    <div class="receipt-title">${title}</div>

                    <div class="details-grid">
                        <div class="detail-item"><span class="label">Date</span><span class="value">${dateStr}</span></div>
                        <div class="detail-item"><span class="label">Student Name</span><span class="value">${profile?.full_name?.toUpperCase()}</span></div>
                        <div class="detail-item"><span class="label">Class</span><span class="value">${classDetails.className} / Section ${classDetails.sectionName}</span></div>
                        <div class="detail-item"><span class="label">Admission No</span><span class="value">${studentData?.admission_no}</span></div>
                        <div class="detail-item"><span class="label">Parent Name</span><span class="value">${studentData?.parent_name || '-'}</span></div>
                    </div>

                    <table class="payment-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: right;">Amount</th>
                                <th style="text-align: right;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                            <tr class="total-row">
                                <td>Total Fees</td>
                                <td style="text-align: right;">Rs.${totalAmount}</td>
                                <td></td>
                            </tr>
                            <tr class="total-row">
                                <td>Total Paid</td>
                                <td style="text-align: right;">Rs.${totalPaid}</td>
                                <td></td>
                            </tr>
                            ${isStatement ? `
                            <tr class="total-row" style="color: #b91c1c;">
                                <td>Pending Due</td>
                                <td style="text-align: right;">Rs.${totalPending}</td>
                                <td></td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>

                    <div style="font-size: 10px; font-style: italic; color: #64748b; margin-bottom: 20px;">
                        This is a computer-generated document.
                    </div>

                    <div class="footer">
                        <div class="sig-box">
                            <div class="sig-line"></div>
                            <div class="sig-text">Depositor Signature</div>
                        </div>
                        <div class="sig-box">
                            <div class="sig-line"></div>
                            <div class="sig-text">Authorized Signatory</div>
                        </div>
                    </div>
                </div>
                </body>
            </html>
            `;

            const { uri } = await Print.printToFileAsync({ html, base64: false });
            // Added dialogTitle for Android
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Receipt' });

        } catch (error: any) {
            Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSingleReceipt = (record: any) => {
        generatePDF([record], false);
    };

    const handleFullStatement = () => {
        generatePDF(feeRecords, true);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchFees();
    }, []);

    const filteredRecords = feeRecords.filter(r => {
        if (filter === 'ALL') return true;
        return r.status === filter;
    });

    const formatCurrency = (amount: number) => {
        return `Rs.${amount.toLocaleString('en-IN')}`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            {loading && (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            >
                {/* 1. Navy Blue Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>Tuition & Fees</Text>
                        <View style={[styles.statusBadge, { backgroundColor: stats.status === 'CLEARED' ? '#22c55e' : '#ef4444' }]}>
                            {stats.status === 'CLEARED' ? <CheckCircle size={14} color="#fff" /> : <AlertTriangle size={14} color="#fff" />}
                            <Text style={styles.statusText}>{stats.status}</Text>
                        </View>
                    </View>

                    <View style={styles.balanceRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.balanceLabel}>Total Pending</Text>
                            <Text style={styles.balanceAmount} adjustsFontSizeToFit numberOfLines={1}>{formatCurrency(stats.pending)}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={styles.balanceLabel}>Total Paid</Text>
                            <Text style={[styles.balanceAmount, { opacity: 0.8 }]} adjustsFontSizeToFit numberOfLines={1}>{formatCurrency(stats.paid)}</Text>
                        </View>
                    </View>

                    {/* Statement Download Button */}
                    <TouchableOpacity style={styles.statementBtn} onPress={handleFullStatement}>
                        <FileText size={16} color="#0f172a" />
                        <Text style={styles.statementBtnText}>Download Full Statement</Text>
                    </TouchableOpacity>

                    <View style={styles.lockStatus}>
                        {stats.status === 'CLEARED' ? (
                            <View style={styles.lockRow}>
                                <Unlock size={16} color="#4ade80" />
                                <Text style={styles.lockText}>Review & Exam Access Unlocked</Text>
                            </View>
                        ) : (
                            <View style={styles.lockRow}>
                                <Lock size={16} color="#fca5a5" />
                                <Text style={[styles.lockText, { color: '#fca5a5' }]}>Review & Exam Access Locked</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 2. Tabs */}
                <View style={styles.tabs}>
                    {['ALL', 'PAID', 'UNPAID'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, filter === tab && styles.activeTab]}
                            onPress={() => setFilter(tab)}
                        >
                            <Text style={[styles.tabText, filter === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 3. Fee List */}
                <View style={styles.list}>
                    {filteredRecords.map((item) => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconBox}>
                                    <DollarSign size={20} color={theme.colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardDate}>Due: {item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : 'N/A'}</Text>
                                </View>
                                <Text style={styles.cardAmount}>{formatCurrency(item.amount)}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.cardFooter}>
                                <View style={styles.footerItem}>
                                    <Text style={styles.footerLabel}>Status</Text>
                                    <View style={[styles.miniBadge, { backgroundColor: item.status === 'PAID' ? '#dcfce7' : '#fee2e2' }]}>
                                        <Text style={[styles.miniBadgeText, { color: item.status === 'PAID' ? '#166534' : '#b91c1c' }]}>{item.status}</Text>
                                    </View>
                                </View>
                                <View style={[styles.footerItem, { alignItems: 'flex-end' }]}>
                                    <Text style={styles.footerLabel}>Marked By</Text>
                                    <Text style={styles.footerValue}>{item.status === 'PAID' ? item.markedBy : '-'}</Text>
                                </View>
                            </View>
                            {item.status === 'PAID' && (
                                <View>
                                    <View style={styles.paidDateRow}>
                                        <CheckCircle size={12} color="#166534" />
                                        <Text style={styles.paidDateText}>Paid on {item.paymentDate ? format(new Date(item.paymentDate), 'MMM dd, yyyy') : 'Unknown'}</Text>
                                    </View>

                                    <TouchableOpacity style={styles.receiptBtn} onPress={() => handleSingleReceipt(item)}>
                                        <Share2 size={16} color="#fff" />
                                        <Text style={styles.receiptBtnText}>Share Receipt</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}

                    {filteredRecords.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No records found.</Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingOverlay: { backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
    content: { padding: 16, paddingBottom: 40 },

    // Header
    headerCard: {
        backgroundColor: '#0f172a', // Navy Blue
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { color: '#94a3b8', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
    balanceLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
    balanceAmount: { color: '#fff', fontSize: 24, fontWeight: '800' },

    statementBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 16, gap: 8 },
    statementBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 13 },

    lockStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, justifyContent: 'center' },
    lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    lockText: { color: '#4ade80', fontSize: 12, fontWeight: '600' },

    // Tabs
    tabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: '#0f172a' },
    tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    activeTabText: { color: '#fff' },

    // List
    list: { gap: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    cardDate: { fontSize: 12, color: '#64748b' },
    cardAmount: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    footerItem: {},
    footerLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
    footerValue: { fontSize: 13, fontWeight: '600', color: '#334155' },

    miniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    miniBadgeText: { fontSize: 10, fontWeight: 'bold' },

    paidDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
    paidDateText: { fontSize: 11, color: '#166534', fontStyle: 'italic', flex: 1 },

    receiptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', paddingVertical: 8, borderRadius: 6, marginTop: 12, gap: 8 },
    receiptBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8' }
});
