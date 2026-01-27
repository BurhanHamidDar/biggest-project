import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { X, Save, AlignLeft, Info } from 'lucide-react-native';
import api from '../lib/api';
import { useAlert } from '../context/AlertContext';

interface AddNoteModalProps {
    visible: boolean;
    onClose: () => void;
    studentId: string;
    onSuccess: () => void;
}

export default function AddNoteModal({ visible, onClose, studentId, onSuccess }: AddNoteModalProps) {
    const { showAlert } = useAlert();
    const [noteText, setNoteText] = useState('');
    const [noteType, setNoteType] = useState('General'); // General, Academic, Behaviour
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!noteText.trim()) {
            showAlert({ type: 'error', title: 'Error', message: 'Note content cannot be empty' });
            return;
        }

        if (noteText.length > 500) {
            showAlert({ type: 'error', title: 'Error', message: 'Note is too long (max 500 chars)' });
            return;
        }

        try {
            setLoading(true);
            await api.post('/student-notes', {
                student_id: studentId,
                note_text: noteText,
                note_type: noteType
            });

            showAlert({ type: 'success', title: 'Success', message: 'Note added successfully.' });
            setNoteText('');
            setNoteType('General');
            onSuccess(); // Refresh list on parent
            onClose();

        } catch (error: any) {
            showAlert({ type: 'error', title: 'Failed', message: error.response?.data?.error || 'Could not save note.' });
        } finally {
            setLoading(false);
        }
    };

    const NoteTypeButton = ({ type, label }: { type: string, label: string }) => (
        <TouchableOpacity
            style={[
                styles.typeBtn,
                noteType === type && styles.typeBtnActive
            ]}
            onPress={() => setNoteType(type)}
        >
            <Text style={[
                styles.typeBtnText,
                noteType === type && styles.typeBtnTextActive
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.container}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Add Student Note</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <X size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.form}>
                                <Text style={styles.label}>Note Type</Text>
                                <View style={styles.typeRow}>
                                    <NoteTypeButton type="General" label="General" />
                                    <NoteTypeButton type="Academic" label="Academic" />
                                    <NoteTypeButton type="Behaviour" label="Behaviour" />
                                </View>

                                <Text style={styles.label}>Note Content</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        multiline
                                        numberOfLines={6}
                                        placeholder="Write your remarks here..."
                                        placeholderTextColor="#94a3b8"
                                        value={noteText}
                                        onChangeText={setNoteText}
                                        textAlignVertical="top"
                                    />
                                    <View style={styles.charCount}>
                                        <Text style={[styles.countText, noteText.length > 500 && { color: 'red' }]}>
                                            {noteText.length}/500
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Save size={20} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.submitText}>Save Note</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeBtn: {
        padding: 4,
    },
    form: {
        gap: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    typeBtnActive: {
        backgroundColor: '#111827', // Navy
        borderColor: '#111827',
    },
    typeBtnText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    typeBtnTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#fff',
        padding: 12,
        height: 150,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
    },
    charCount: {
        alignItems: 'flex-end',
        marginTop: 4,
    },
    countText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    submitBtn: {
        backgroundColor: '#111827',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 12,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
