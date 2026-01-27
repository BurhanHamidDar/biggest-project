import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Dimensions, StatusBar, ImageBackground, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, User, Lock, ArrowRight, Eye, EyeOff, GraduationCap } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
    const { signIn, loading: authLoading } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loginType, setLoginType] = useState<'password' | 'otp'>('password');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');

    const handleLogin = async () => {
        if (!email) {
            showAlert({ type: 'error', title: 'Error', message: 'Please enter your email/username' });
            return;
        }

        try {
            setLoading(true);

            if (loginType === 'password') {
                if (!password) {
                    showAlert({ type: 'error', title: 'Error', message: 'Please enter your password' });
                    setLoading(false);
                    return;
                }
                await signIn(email, password);
                setLoading(false);
            }
            else {
                // OTP Flow
                // OTP Flow
                if (!otpSent) {
                    // Validation: Must be a valid email
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        showAlert({ type: 'error', title: 'Invalid Email', message: 'Please enter a valid email address for OTP login.' });
                        setLoading(false);
                        return;
                    }

                    // Step 1: Send OTP
                    const { error } = await supabase.auth.signInWithOtp({
                        email: email.trim().toLowerCase()
                    });

                    if (error) throw error;

                    setOtpSent(true);
                    showAlert({ type: 'success', title: 'OTP Sent', message: 'Check your email for the verification code.' });
                    setLoading(false);
                } else {
                    // Step 2: Verify OTP
                    const cleanCode = otpCode.trim();
                    const cleanEmail = email.trim().toLowerCase();

                    if (!cleanCode || cleanCode.length < 6) {
                        showAlert({ type: 'error', title: 'Invalid Code', message: 'Please enter a valid OTP code.' });
                        setLoading(false);
                        return;
                    }

                    // Try verifying as 'email' (Login) first
                    let { data, error } = await supabase.auth.verifyOtp({
                        email: cleanEmail,
                        token: cleanCode,
                        type: 'email'
                    });

                    // If 'email' type fails, try 'signup' type (for unconfirmed/new users)
                    if (error) {
                        console.log('Teacher Login verification failed, trying signup verification...');
                        const { data: signupData, error: signupError } = await supabase.auth.verifyOtp({
                            email: cleanEmail,
                            token: cleanCode,
                            type: 'signup'
                        });

                        if (signupError) {
                            console.error('Teacher: All verification attempts failed:', signupError);
                            throw signupError;
                        }
                    }

                    // Success - AuthListener in context will handle redirect
                    setLoading(false);
                }
            }
        } catch (error: any) {
            setLoading(false);
            showAlert({ type: 'error', title: 'Login Failed', message: error.message });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

            {/* Header Background */}
            <View style={styles.headerBackground} />

            {/* Main Content */}
            <View style={styles.contentContainer}>

                {/* Logo Section (Overlapping) */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/school_logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.schoolName}>Ayesha Ali Academy</Text>
                <Text style={styles.appName}>Teachers App</Text>

                {/* Form Container */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>

                        <Text style={styles.screenTitle}>
                            Login with {loginType === 'password' ? 'Password' : 'OTP'}
                        </Text>

                        {/* Toggle Switch */}
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, loginType === 'otp' && styles.toggleBtnActive]}
                                onPress={() => setLoginType('otp')}
                            >
                                <Text style={[styles.toggleText, loginType === 'otp' && styles.toggleTextActive]}>OTP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, loginType === 'password' && styles.toggleBtnActive]}
                                onPress={() => setLoginType('password')}
                            >
                                <Text style={[styles.toggleText, loginType === 'password' && styles.toggleTextActive]}>PASSWORD</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Inputs */}
                        <View style={styles.inputContainer}>
                            {/* Username/Email Input */}
                            <View style={styles.inputWrapper}>
                                <User size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={loginType === 'otp' ? "Email Address" : "Username / Email"}
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (otpSent) setOtpSent(false); // Reset OTP state if email changes
                                    }}
                                    autoCapitalize="none"
                                    keyboardType={loginType === 'otp' ? "email-address" : "default"}
                                />
                            </View>

                            {/* Password Input */}
                            {loginType === 'password' && (
                                <View style={styles.inputWrapper}>
                                    <Lock size={20} color="#64748b" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor="#94a3b8"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* OTP Flow UI */}
                            {loginType === 'otp' && (
                                <>
                                    {!otpSent ? (
                                        <View style={styles.inputWrapper}>
                                            <Text style={{ color: '#64748b', fontSize: 14 }}>
                                                We will send a One Time Password to your email.
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.inputWrapper}>
                                            <Lock size={20} color="#64748b" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter OTP Code"
                                                placeholderTextColor="#94a3b8"
                                                value={otpCode}
                                                onChangeText={setOtpCode}
                                                keyboardType="number-pad"
                                                maxLength={8}
                                            />
                                        </View>
                                    )}
                                </>
                            )}
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.disabledBtn]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginBtnText}>
                                    {loginType === 'otp' && !otpSent ? 'SEND OTP' : 'LOG IN'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Footer Links */}
                        <View style={styles.footerLinks}>
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.linkText}>Forgot password?</Text>
                            </TouchableOpacity>

                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // White body
    },
    headerBackground: {
        height: height * 0.25, // Top 25% Navy
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    contentContainer: {
        flex: 1,
        marginTop: -50, // Pull up to overlap with header slightly if needed, or just standard flow
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 60, // Space for the Logo
    },
    logoContainer: {
        position: 'absolute',
        top: -60, // Half in header, half in body
        alignSelf: 'center',
        backgroundColor: '#fff', // No background or white circle if needed? Image seems transparent but placed on bg
        // The reference has logo ON the junction. 
        // Let's create a white circle background for it to match the "cutout" look if desired, 
        // or just place it. The reference has a glow/rays, likely part of the image.
        // We'll just position it.
        zIndex: 10,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderRadius: 60, // Circular shadow
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    logo: {
        width: 100,
        height: 100,
    },
    schoolName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 8,
        textAlign: 'center',
        marginBottom: 4,
    },
    appName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Form Layout
    formScroll: {
        paddingBottom: 40,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        marginBottom: 24,
    },

    // Toggle
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 25,
        padding: 4,
        marginBottom: 32,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
    },
    toggleBtnActive: {
        backgroundColor: theme.colors.primary, // Navy
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    toggleTextActive: {
        color: '#fff',
    },

    // Inputs (Box Style)
    inputContainer: {
        gap: 16,
        marginBottom: 32,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
    },

    // Login Button
    loginBtn: {
        backgroundColor: theme.colors.primary, // Navy
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledBtn: {
        opacity: 0.7,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Footer
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        paddingHorizontal: 8,
    },
    linkText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
});
