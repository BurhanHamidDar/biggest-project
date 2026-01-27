import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Dimensions, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Mail, MapPin, Bus, User, Calendar, GraduationCap, Plus, Shield, Users, Trash2 } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext'; // Added useAuth
import AddNoteModal from '../components/AddNoteModal';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function StudentDetailScreen({ route, navigation }: any) {
    const { student } = route.params;
    const { user } = useAuth(); // Get current user
    const profile = student.profiles;
    const busNumber = student.buses?.bus_number;

    const [notes, setNotes] = useState<any[]>([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchNotes = async () => {
        try {
            const { data } = await api.get(`/student-notes/by-student/${student.profile_id}`);
            setNotes(data);
        } catch (error) {
            console.log('Error fetching notes:', error);
        } finally {
            setNotesLoading(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to delete this note? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/student-notes/${noteId}`);
                            fetchNotes(); // Refresh list
                        } catch (error: any) {
                            Alert.alert("Error", error.response?.data?.details || "Failed to delete note.");
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const InfoRow = ({ icon: Icon, label, value, isLink, onPress }: any) => (
        <TouchableOpacity
            style={styles.infoRow}
            activeOpacity={isLink ? 0.7 : 1}
            onPress={isLink ? onPress : undefined}
        >
            <View style={styles.iconBox}>
                <Icon size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={[styles.infoValue, isLink && styles.linkValue]}>{value || 'Not provided'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} bounces={false}>
                {/* Header Section */}
                <LinearGradient
                    colors={[theme.colors.primary, '#1e1b4b']} // Navy to darker navy
                    style={styles.header}
                >
                    <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerContent}>
                        {/* Navigation Bar */}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ArrowLeft color="#fff" size={24} />
                        </TouchableOpacity>

                        <View style={styles.profileImageContainer}>
                            {profile.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.profileImage} />
                            ) : (
                                <View style={[styles.profileImage, styles.placeholderImage]}>
                                    <Text style={styles.initials}>
                                        {profile.full_name?.charAt(0) || 'S'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.verifiedBadge}>
                                <Shield size={12} color="#fff" fill={theme.colors.primary} />
                            </View>
                        </View>

                        <Text style={styles.studentName}>{profile.full_name}</Text>
                        <Text style={styles.classInfo}>
                            {student.classes?.name} - {student.sections?.name}
                        </Text>
                        <View style={styles.admissionBadge}>
                            <Text style={styles.admissionText}>Adm No: {student.admission_no} • Roll: {student.roll_no || '-'}</Text>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Info Cards */}
                <View style={styles.cardsContainer}>

                    {/* Personal Information */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Personal Information</Text>
                        <InfoRow
                            icon={User}
                            label="Gender"
                            value={student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : null}
                        />
                        <InfoRow
                            icon={Calendar}
                            label="Date of Birth"
                            value={student.dob ? format(new Date(student.dob), 'dd MMM yyyy') : null}
                        />
                        <InfoRow icon={MapPin} label="Address" value={profile.address} />
                    </View>

                    {/* Contact Information */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Contact Information</Text>
                        <InfoRow
                            icon={Mail}
                            label="Email"
                            value={profile.email}
                            isLink
                            onPress={() => Linking.openURL(`mailto:${profile.email}`)}
                        />
                        <InfoRow
                            icon={Phone}
                            label="Student Phone"
                            value={profile.phone_number}
                            isLink
                            onPress={() => Linking.openURL(`tel:${profile.phone_number}`)}
                        />
                        <InfoRow icon={Users} label="Parent Name" value={student.parent_name} />
                        <InfoRow
                            icon={Phone}
                            label="Parent Phone"
                            value={student.parent_phone}
                            isLink
                            onPress={() => Linking.openURL(`tel:${student.parent_phone}`)}
                        />
                    </View>

                    {/* School Information */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>School Information</Text>
                        <InfoRow icon={Bus} label="Transport Status" value={busNumber ? 'Yes' : 'No'} />
                        {busNumber && (
                            <InfoRow icon={Bus} label="Transport Route" value={busNumber} />
                        )}
                    </View>

                    {/* Teacher Notes Section */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.cardTitle}>Teacher Notes</Text>
                            <TouchableOpacity style={styles.addNoteBtn} onPress={() => setModalVisible(true)}>
                                <Plus size={16} color="#fff" />
                                <Text style={styles.addNoteText}>Add Note</Text>
                            </TouchableOpacity>
                        </View>

                        {notesLoading ? (
                            <ActivityIndicator color={theme.colors.primary} />
                        ) : notes.length === 0 ? (
                            <Text style={styles.emptyText}>No notes added yet.</Text>
                        ) : (
                            <View style={{ gap: 12 }}>
                                {notes.map((note) => (
                                    <View key={note.id} style={styles.noteItem}>
                                        <View style={styles.noteHeader}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <User size={14} color="#64748b" />
                                                <Text style={styles.noteTeacher}>{note.teacher_name}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <Text style={styles.noteDate}>{format(new Date(note.created_at), 'dd MMM yyyy')}</Text>
                                                {user && note.teacher_id === user.id && (
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteNote(note.id)}
                                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    >
                                                        <Trash2 size={16} color="#ef4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.noteBadges}>
                                            <View style={[styles.typeBadge, note.note_type === 'Academic' ? { backgroundColor: '#dbeafe' } : note.note_type === 'Behaviour' ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#f3f4f6' }]}>
                                                <Text style={[styles.typeText, note.note_type === 'Academic' ? { color: '#1e40af' } : note.note_type === 'Behaviour' ? { color: '#991b1b' } : { color: '#374151' }]}>
                                                    {note.note_type}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.noteContent}>{note.note_text}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>

            <AddNoteModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                studentId={student.profile_id}
                onSuccess={fetchNotes}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },

    header: {
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        alignItems: 'center',
    },
    headerContent: { alignItems: 'center', width: '100%', paddingTop: 10 },
    backBtn: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 8,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },

    profileImageContainer: {
        marginBottom: 16,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginTop: 20,
    },
    profileImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#fff',
    },
    placeholderImage: {
        backgroundColor: '#cbd5e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#475569',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },

    studentName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textAlign: 'center',
    },
    classInfo: {
        fontSize: 16,
        color: '#e2e8f0',
        marginBottom: 12,
        fontWeight: '500',
    },
    admissionBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    admissionText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
    },

    cardsContainer: {
        marginTop: -25,
        paddingHorizontal: 20,
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8,
        flex: 1,
    },

    // Info Row Styles
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },
    linkValue: {
        color: '#2563eb',
        textDecorationLine: 'underline',
    },

    // Notes Styles
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8,
    },
    addNoteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    addNoteText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 10,
    },
    noteItem: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    noteTeacher: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    noteDate: {
        fontSize: 11,
        color: '#94a3b8',
    },
    noteBadges: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    noteContent: {
        fontSize: 14,
        color: '#1e293b',
        lineHeight: 20,
    },
});
