import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAlert } from '../context/AlertContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../theme';

type ForgotPasswordProps = {
    navigation: StackNavigationProp<any>;
};

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordProps) {
    const { showAlert } = useAlert();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email) {
            showAlert({ type: 'error', title: 'Error', message: 'Please enter your email address' });
            return;
        }

        try {
            setLoading(true);

            // Create clean email variable
            const cleanEmail = email.trim().toLowerCase();

            // Send OTP (Login with OTP flow)
            const { error } = await supabase.auth.signInWithOtp({
                email: cleanEmail,
                options: {
                    shouldCreateUser: false
                }
            });

            if (error) throw error;

            showAlert({
                type: 'success',
                title: 'OTP Sent',
                message: 'A verification code has been sent to your email.',
                onConfirm: () => navigation.navigate('ResetPassword', { email: cleanEmail })
            });

        } catch (error: any) {
            showAlert({ type: 'error', title: 'Failed', message: error.message || 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft color={theme.colors.text.primary} size={24} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Enter the email address associated with your account, and we’ll send you a link to reset your password.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail color={theme.colors.text.secondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="name@school.com"
                                placeholderTextColor={theme.colors.text.secondary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && { opacity: 0.7 }]}
                        onPress={handleReset}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.buttonText}>Send OTP</Text>
                                <Send color="white" size={18} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
    },
    backButton: {
        marginBottom: 24,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        lineHeight: 24,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: '#f9fafb',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.primary,
    },
    button: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});
