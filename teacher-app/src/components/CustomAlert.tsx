import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Check, AlertTriangle, Info, AlertCircle, Lock } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'confirm' | 'info' | 'block';

interface CustomAlertProps {
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function CustomAlert({
    visible,
    type,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "OK",
    cancelText = "Cancel"
}: CustomAlertProps) {
    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <Check color="#fff" size={32} />;
            case 'error':
                return <AlertTriangle color="#fff" size={32} />;
            case 'confirm':
                return <AlertCircle color="#fff" size={32} />;
            case 'info':
                return <Info color="#fff" size={32} />;
            case 'block':
                return <Lock color="#fff" size={32} />;
            default:
                return <Info color="#fff" size={32} />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return { bg: '#10B981', header: '#111827' }; // Green
            case 'error':
                return { bg: '#EF4444', header: '#ef4444' }; // Red
            case 'confirm':
                return { bg: '#F59E0B', header: '#111827' }; // Amber
            case 'info':
                return { bg: '#3B82F6', header: '#111827' }; // Blue
            case 'block':
                return { bg: '#6B7280', header: '#1f2937' }; // Gray
            default:
                return { bg: '#3B82F6', header: '#111827' };
        }
    };

    const colors = getColors();

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
    };

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={styles.overlay}>
                <View style={styles.alertContainer}>
                    {/* Icon Header */}
                    <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
                        {getIcon()}
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        {/* Only show Cancel if it's a confirmation or error with retry (custom logic) */}
                        {(type === 'confirm' || (type === 'error' && onCancel)) && (
                            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                                <Text style={styles.cancelText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.confirmBtn, { flex: (type === 'confirm' || onCancel) ? 1 : 0, width: (type === 'confirm' || onCancel) ? 'auto' : '100%' }]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmText}>{confirmText}</Text>
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
        padding: 20,
    },
    alertContainer: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        padding: 24,
        paddingTop: 40,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: -32,
        borderWidth: 4,
        borderColor: '#fff',
    },
    content: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    confirmBtn: {
        backgroundColor: '#111827', // Navy
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 15,
    }
});
