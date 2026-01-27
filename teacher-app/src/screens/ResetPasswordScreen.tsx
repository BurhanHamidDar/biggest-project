import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAlert } from '../context/AlertContext';
import { StackNavigationProp } from '@react-navigation/stack';

type ResetPasswordProps = {
    navigation: StackNavigationProp<any>;
};

export default function ResetPasswordScreen({ navigation, route }: any) {
    const { showAlert } = useAlert();
    const { email } = route.params || {};

    const [otp, setOtp] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async () => {
        if (!otp || !newPass || !confirmPass) {
            showAlert({ type: 'error', title: 'Error', message: 'Please fill all fields' });
            return;
        }

        if (newPass.length < 6) {
            showAlert({ type: 'error', title: 'Invalid Password', message: 'Password must be at least 6 characters' });
            return;
        }

        if (newPass !== confirmPass) {
            showAlert({ type: 'error', title: 'Mismatch', message: 'Passwords do not match' });
            return;
        }

        try {
            setLoading(true);

            // 1. Verify OTP
            // Ensure email is clean
            const cleanEmail = email.trim().toLowerCase();

            console.log('Verifying OTP for:', cleanEmail, 'with token:', otp);

            // type: 'email' is the standard for 6-digit OTPs sent via signInWithOtp
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email: cleanEmail,
                token: otp,
                type: 'email',
            });

            if (verifyError) throw verifyError;

            // 2. Set new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPass
            });

            if (updateError) throw updateError;

            showAlert({
                type: 'success',
                title: 'Password Reset',
                message: 'Your password has been reset successfully. Please login with your new password.',
                onConfirm: () => {
                    supabase.auth.signOut();
                    navigation.navigate('Login');
                }
            });

        } catch (error: any) {
            console.error('Reset error:', error);
            showAlert({ type: 'error', title: 'Failed', message: error.message || 'Invalid or expired OTP.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Lock color="#2563eb" size={40} />
                    </View>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Enter the code sent to {email} and set your new password.
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* OTP Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>OTP Code</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter verification code"
                                placeholderTextColor="#9ca3af"
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={8}
                            />
                        </View>
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputContainer}>
                            <Lock color="#9ca3af" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showNew}
                                value={newPass}
                                onChangeText={setNewPass}
                                placeholder="Min 6 characters"
                                placeholderTextColor="#9ca3af"
                            />
                            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                                {showNew ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.inputContainer}>
                            <Lock color="#9ca3af" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showConfirm}
                                value={confirmPass}
                                onChangeText={setConfirmPass}
                                placeholder="Re-enter password"
                                placeholderTextColor="#9ca3af"
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                {showConfirm ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.buttonText}>Reset Password</Text>
                                <CheckCircle color="white" size={20} />
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
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#eff6ff',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        paddingHorizontal: 20,
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
        color: '#374151',
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
        color: '#111827',
    },
    button: {
        backgroundColor: '#111827',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#111827',
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
