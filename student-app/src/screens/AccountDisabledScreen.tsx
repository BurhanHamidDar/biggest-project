import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ban, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface AccountDisabledScreenProps {
    reason: string;
}

export default function AccountDisabledScreen({ reason }: AccountDisabledScreenProps) {
    const { signOut } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ban color="#ef4444" size={64} />
                </View>

                <Text style={styles.title}>Account Disabled</Text>

                <Text style={styles.message}>
                    Your account has been disabled by the administration.
                </Text>

                <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{reason || "No reason provided."}</Text>
                </View>

                <Text style={styles.instruction}>
                    Please contact the school administration if you believe this is an error.
                </Text>

                <TouchableOpacity style={styles.button} onPress={signOut}>
                    <LogOut color="white" size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
    },
    iconContainer: {
        backgroundColor: '#fee2e2',
        padding: 20,
        borderRadius: 100,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    reasonBox: {
        width: '100%',
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9ca3af',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    reasonText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    instruction: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 40,
        fontStyle: 'italic',
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#ef4444',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
        elevation: 2,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
