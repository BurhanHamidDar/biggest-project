import React, { createContext, useState, useContext } from 'react';
import CustomAlert from '../components/CustomAlert';

interface AlertOptions {
    type: 'success' | 'error' | 'info' | 'warning' | 'confirm' | 'block';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);

    const showAlert = (options: AlertOptions) => {
        setAlertConfig(options);
    };

    const hideAlert = () => {
        setAlertConfig(null);
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alertConfig && (
                <CustomAlert
                    visible={!!alertConfig}
                    type={alertConfig.type}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={hideAlert}
                    onConfirm={alertConfig.onConfirm}
                />
            )}
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
