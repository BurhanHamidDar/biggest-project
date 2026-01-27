import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Image
                    source={require('../../assets/images/school_logo.png')}
                    style={styles.logo}
                    contentFit="contain"
                />

                <View style={styles.textContainer}>
                    <Text style={styles.schoolName}>Ayesha Ali Academy</Text>
                    <View style={styles.badge}>
                        <Text style={styles.appTitle}>TEACHER APP</Text>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background, // Or specific brand color e.g. #fff or #1e293b
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    logo: {
        width: width * 0.4,
        height: width * 0.4,
    },
    textContainer: {
        alignItems: 'center',
        gap: 8,
    },
    schoolName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    badge: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    appTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 1.5,
    }
});
