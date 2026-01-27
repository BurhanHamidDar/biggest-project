import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Search, Phone, Mail, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function StudentsScreen({ navigation }: any) {
    const [students, setStudents] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            // Fetch All Students for Teacher's Classes
            const { data } = await api.get('/teachers/my-students');
            setStudents(data);
            setFiltered(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearch(text);
        if (!text) setFiltered(students);
        else {
            const lower = text.toLowerCase();
            setFiltered(students.filter(s =>
                s.profiles.full_name.toLowerCase().includes(lower) ||
                s.admission_no.toLowerCase().includes(lower)
            ));
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.header}
            >
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>My Students</Text>
                        <Text style={styles.headerSubtitle}>Directory & Profiles</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search color="#94a3b8" size={20} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search name or admission no..."
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {loading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} /> : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.profile_id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('StudentDetail', { student: item })}>
                            <View style={styles.avatar}>
                                {item.profiles.avatar_url ? (
                                    <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImg} />
                                ) : (
                                    <Text style={styles.avatarText}>{item.profiles.full_name.charAt(0)}</Text>
                                )}
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.name}>{item.profiles.full_name}</Text>
                                <Text style={styles.sub}>{item.classes?.name}-{item.sections?.name} • Roll: {item.roll_no || 'N/A'}</Text>
                                <Text style={styles.idText}>ID: {item.admission_no}</Text>
                            </View>
                            <ChevronRight color="#cbd5e1" size={20} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No students found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 16,
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    headerSubtitle: { color: '#cbd5e1', fontSize: 13 },
    searchContainer: {
        marginTop: -24,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderRadius: 16,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    input: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1e293b' },
    list: { padding: 16, paddingTop: 8 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarImg: { width: 50, height: 50, borderRadius: 25 },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    sub: { color: '#64748b', fontSize: 13, marginTop: 2 },
    idText: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8' }
});
