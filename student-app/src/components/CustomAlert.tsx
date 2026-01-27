import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CheckCircle, AlertCircle, Info, XCircle, ShieldAlert } from 'lucide-react-native';
import { theme } from '../theme';

interface CustomAlertProps {
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning' | 'confirm' | 'block';
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
}

const { width } = Dimensions.get('window');

export default function CustomAlert({ visible, type, title, message, onClose, onConfirm }: CustomAlertProps) {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={48} color={theme.colors.success} />;
            case 'error': return <XCircle size={48} color={theme.colors.error} />;
            case 'block': return <ShieldAlert size={48} color={theme.colors.error} />;
            case 'warning': return <AlertCircle size={48} color={theme.colors.warning} />;
            case 'info':
            default: return <Info size={48} color={theme.colors.accent} />;
        }
    };

    const getPrimaryColor = () => {
        switch (type) {
            case 'success': return theme.colors.success;
            case 'error': return theme.colors.error;
            case 'block': return theme.colors.error;
            case 'warning': return theme.colors.warning;
            default: return theme.colors.accent;
        }
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.alertContainer}>
                    <View style={styles.iconContainer}>
                        {getIcon()}
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonRow}>
                        {type === 'confirm' && (
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: getPrimaryColor() }]}
                            onPress={() => {
                                if (onConfirm) onConfirm();
                                onClose();
                            }}
                        >
                            <Text style={styles.buttonText}>
                                {type === 'confirm' ? 'Confirm' : 'OK'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    alertContainer: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10
    },
    iconContainer: {
        marginBottom: 16
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center'
    },
    message: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%'
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    cancelText: {
        color: '#374151',
        fontWeight: 'bold',
        fontSize: 16
    }
});
