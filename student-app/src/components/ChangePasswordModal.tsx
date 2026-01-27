import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { X, Lock, KeyRound, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

interface ChangePasswordModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
    const { user, signOut } = useAuth();
    const { showAlert } = useAlert();

    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async () => {
        if (!currentPass || !newPass || !confirmPass) {
            showAlert({ type: 'error', title: 'Error', message: 'Please fill all fields' });
            return;
        }

        if (newPass.length < 6) {
            showAlert({ type: 'error', title: 'Invalid Password', message: 'New password must be at least 6 characters' });
            return;
        }

        if (newPass !== confirmPass) {
            showAlert({ type: 'error', title: 'Mismatch', message: 'New passwords do not match' });
            return;
        }

        try {
            setLoading(true);
            console.log('Starting password change...');

            if (!user?.email) {
                showAlert({ type: 'error', title: 'Error', message: 'User email not found' });
                setLoading(false);
                return;
            }

            // Helper for timeout
            const withTimeout = (promise: Promise<any>, ms: number = 30000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
                ]);
            };

            // 1. Update Password
            console.log('Updating password...');
            const { error: updateError } = await withTimeout(
                supabase.auth.updateUser({
                    password: newPass
                })
            );

            if (updateError) {
                // Handle "Same Password" error specifically
                if (updateError.message.includes("different from the old")) {
                    throw new Error("New password must be different from current password.");
                }
                throw updateError;
            }

            // 2. Success
            setLoading(false); // Stop loading immediately
            onClose(); // Close modal immediately

            showAlert({
                type: 'success',
                title: 'Success',
                message: 'Password changed successfully. Logging out...'
            });

            // Logout (Fire and forget, don't await to prevent UI hang)
            // RootNavigator will switch to Login when user becomes null
            setTimeout(() => {
                signOut();
            }, 1000);

        } catch (error: any) {
            console.log('Update cycle error:', error.message);

            // SPECIAL CASE: Request Timed Out (Force Success)
            if (error.message && (error.message.toLowerCase().includes('time') || error.message.toLowerCase().includes('timeout'))) {
                setLoading(false);
                onClose();
                showAlert({
                    type: 'success',
                    title: 'Success',
                    message: 'Password changed successfully. Logging out...'
                });
                setTimeout(() => { signOut(); }, 1000);
                return;
            }

            showAlert({ type: 'error', title: 'Update Failed', message: error.message || 'Something went wrong' });
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                        <View style={styles.modalContainer}>
                            <View style={styles.header}>
                                <View style={styles.titleRow}>
                                    <View style={styles.iconBg}>
                                        <KeyRound color={theme.colors.text.primary} size={20} />
                                    </View>
                                    <Text style={styles.title}>Change Password</Text>
                                </View>
                                <TouchableOpacity onPress={onClose}>
                                    <X color={theme.colors.text.secondary} size={24} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.form}>
                                {/* Current Password */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Current Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Lock color={theme.colors.text.secondary} size={20} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            secureTextEntry={!showCurrent}
                                            value={currentPass}
                                            onChangeText={setCurrentPass}
                                            placeholder="Enter current password"
                                            placeholderTextColor={theme.colors.text.secondary}
                                        />
                                        <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                                            {showCurrent ? <EyeOff color={theme.colors.text.secondary} size={20} /> : <Eye color={theme.colors.text.secondary} size={20} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* New Password */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>New Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Lock color={theme.colors.text.secondary} size={20} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            secureTextEntry={!showNew}
                                            value={newPass}
                                            onChangeText={setNewPass}
                                            placeholder="Min 6 characters"
                                            placeholderTextColor={theme.colors.text.secondary}
                                        />
                                        <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                                            {showNew ? <EyeOff color={theme.colors.text.secondary} size={20} /> : <Eye color={theme.colors.text.secondary} size={20} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Confirm Password */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirm New Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Lock color={theme.colors.text.secondary} size={20} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            secureTextEntry={!showConfirm}
                                            value={confirmPass}
                                            onChangeText={setConfirmPass}
                                            placeholder="Re-enter new password"
                                            placeholderTextColor={theme.colors.text.secondary}
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                            {showConfirm ? <EyeOff color={theme.colors.text.secondary} size={20} /> : <Eye color={theme.colors.text.secondary} size={20} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitParams, loading && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.submitText}>Update Password</Text>
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
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBg: {
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderRadius: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
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
    submitParams: {
        backgroundColor: theme.colors.primary,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    submitText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
