import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { ArrowLeft, Calendar, User, Paperclip, Download } from 'lucide-react-native';
import AttachmentViewer from '../../components/AttachmentViewer';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function HomeworkDetailScreen({ route, navigation }: any) {
    const { homework } = route.params || {};

    if (!homework) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ padding: 20 }}>
                    <Text>Error: Homework not found</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}><Text>Go Back</Text></TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
    const [viewerVisible, setViewerVisible] = useState(false);

    const handleDownload = async () => {
        if (!homework.attachment_url) return;

        try {
            // Check platform for download behavior
            // For now, simple share if available
            const filename = homework.attachment_url.split('/').pop();
            const result = await FileSystem.downloadAsync(
                homework.attachment_url,
                FileSystem.documentDirectory + filename
            );

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(result.uri);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Homework Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.mainCard}>
                    <Text style={styles.subject}>{homework.subjects?.name}</Text>
                    <Text style={styles.title}>{homework.title}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <User size={16} color="#64748b" />
                            <Text style={styles.metaText}>{homework.teachers?.profiles?.full_name}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Calendar size={16} color="#64748b" />
                            <Text style={styles.metaText}>Due: {new Date(homework.due_date).toDateString()}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionLabel}>Instructions</Text>
                    <Text style={styles.description}>{homework.description}</Text>

                    {homework.attachment_url && (
                        <View style={styles.attachmentSection}>
                            <Text style={styles.sectionLabel}>Attachment</Text>
                            <TouchableOpacity style={styles.attachmentCard} onPress={() => setViewerVisible(true)}>
                                <View style={styles.fileIcon}>
                                    <Paperclip size={20} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fileName}>View Attachment</Text>
                                    <Text style={styles.fileType}>Tap to open</Text>
                                </View>
                                <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                                    <Download size={20} color="#64748b" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            <AttachmentViewer
                visible={viewerVisible}
                url={homework.attachment_url}
                type={null}
                name={homework.title}
                onClose={() => setViewerVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        backgroundColor: theme.colors.primary, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 4 },
    content: { padding: 20 },

    mainCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4
    },
    subject: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary, textTransform: 'uppercase', marginBottom: 8 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 16, lineHeight: 30 },

    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    metaText: { color: '#64748b', fontSize: 14, flexShrink: 1 },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 24 },

    sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
    description: { fontSize: 16, color: '#475569', lineHeight: 26, marginBottom: 32 },

    attachmentSection: { marginTop: 8 },
    attachmentCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, gap: 12,
        borderWidth: 1, borderColor: '#e2e8f0'
    },
    fileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.accent, justifyContent: 'center', alignItems: 'center' },
    fileName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    fileType: { fontSize: 12, color: '#94a3b8' },
    downloadBtn: { padding: 8 }
});
