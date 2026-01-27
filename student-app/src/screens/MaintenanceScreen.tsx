import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldAlert, RefreshCcw } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface MaintenanceScreenProps {
    message?: string;
    onRetry?: () => void;
}

export default function MaintenanceScreen({ message, onRetry }: MaintenanceScreenProps) {
    const [loading, setLoading] = useState(false);
    const { checkSystemSettings } = useAuth();

    const handleRetry = async () => {
        try {
            setLoading(true);
            if (onRetry) {
                await onRetry();
            } else {
                // Fallback check via AuthContext
                await checkSystemSettings();
            }
        } catch (error) {
            // Still blocked or error
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <ShieldAlert size={64} color="#EF4444" />
                </View>

                <Text style={styles.title}>System Maintenance</Text>

                <Text style={styles.message}>
                    {message || "The system is currently undergoing scheduled maintenance. Please check back later."}
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRetry}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#111827" />
                    ) : (
                        <>
                            <RefreshCcw size={20} color="#111827" />
                            <Text style={styles.retryText}>Retry Connection</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // Navy Blue
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        gap: 20,
    },
    iconContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tint
        padding: 20,
        borderRadius: 50,
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    retryButton: {
        marginTop: 30,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
    },
    retryText: {
        color: '#111827',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
