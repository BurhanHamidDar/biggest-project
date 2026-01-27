import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { BookOpen, CalendarCheck, FileText, GraduationCap, Banknote, ChevronRight, Lock, ClipboardList, CheckSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function TasksScreen() {
    const navigation = useNavigation<any>();
    const { profile, user } = useAuth();

    const TaskCard = ({ title, desc, icon: Icon, color, bgColor, onPress, locked = false }: any) => (
        <TouchableOpacity style={styles.card} onPress={onPress} disabled={locked}>
            <View style={[styles.iconBox, { backgroundColor: bgColor || color + '15' }]}>
                <Icon size={24} color={color} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDesc}>{desc}</Text>
            </View>
            {locked ? (
                <Lock size={20} color="#cbd5e1" />
            ) : (
                <ChevronRight size={20} color="#cbd5e1" />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Gradient Header */}
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={{ paddingBottom: 20 }}>
                    <Text style={styles.headerTitle}>Academic Tasks</Text>
                    <Text style={styles.headerSub}>Manage your teaching responsibilities</Text>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.section}>
                    <TaskCard
                        title="Homework"
                        desc="Track and manage homework assignments"
                        icon={ClipboardList}
                        color="#0284c7"
                        bgColor="#e0f2fe"
                        onPress={() => navigation.navigate('HomeworkManagement')}
                    />

                    <TaskCard
                        title="Attendance"
                        desc="Mark and review daily attendance"
                        icon={CheckSquare}
                        color="#16a34a"
                        bgColor="#dcfce7"
                        onPress={() => navigation.navigate('AttendanceManagement')}
                    />

                    <TaskCard
                        title="Class Tests"
                        desc="Create and grade class tests"
                        icon={FileText}
                        color="#4338ca"
                        bgColor="#e0e7ff"
                        onPress={() => navigation.navigate('ClassMarks')}
                    />

                    <TaskCard
                        title="Exam Marks"
                        desc="Enter marks for term exams"
                        icon={BookOpen}
                        color="#9333ea"
                        bgColor="#f3e8ff"
                        onPress={() => navigation.navigate('ExamMarks')}
                    />

                    <TaskCard
                        title="Mark Fees"
                        desc="Update fee status (HR Only)"
                        icon={Banknote}
                        color="#0891b2"
                        bgColor="#cffafe"
                        onPress={() => navigation.navigate('MarkFees')}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 0,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSub: {
        fontSize: 14,
        color: '#cbd5e1',
    },
    scroll: {
        padding: 24,
    },
    section: {
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
});
