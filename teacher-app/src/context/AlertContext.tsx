import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomAlert, { AlertType } from '../components/CustomAlert';

interface AlertOptions {
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [alertConfig, setAlertConfig] = useState<AlertOptions & { visible: boolean }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    });

    const showAlert = (options: AlertOptions) => {
        setAlertConfig({ ...options, visible: true });
    };

    const hideAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    const handleConfirm = () => {
        if (alertConfig.onConfirm) {
            alertConfig.onConfirm();
        }
        hideAlert();
    };

    const handleCancel = () => {
        if (alertConfig.onCancel) {
            alertConfig.onCancel();
        }
        hideAlert();
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onConfirm={handleConfirm}
                onCancel={alertConfig.onCancel ? handleCancel : undefined} // Only pass if defined
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
            />
        </AlertContext.Provider>
    );
};
