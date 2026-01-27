import React, { useState, useRef } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Text, Dimensions, ScrollView, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode } from 'expo-av';
import { X, ZoomIn, ZoomOut, Minimize, Maximize } from 'lucide-react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface AttachmentViewerProps {
    visible: boolean;
    url: string | null;
    type: string | null; // 'image' | 'video' | 'pdf' | 'other'
    onClose: () => void;
    name?: string;
}

export default function AttachmentViewer({ visible, url, type, onClose, name }: AttachmentViewerProps) {
    const [scale, setScale] = useState(1);
    const scrollRef = useRef<ScrollView>(null);

    if (!visible || !url) return null;

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.5, 3)); // Max zoom 3x
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.5, 1)); // Min zoom 1x
    };

    const handleReset = () => {
        setScale(1);
    };

    const renderContent = () => {
        const ext = url.split('.').pop()?.toLowerCase();
        const isImage = type?.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext || '');
        const isVideo = type?.startsWith('video') || ['mp4', 'mov', 'avi'].includes(ext || '');

        // Handle PDF specifically for Android if needed (using Google Docs viewer)
        // But assuming WebView works for now
        const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
        const isPdf = ext === 'pdf' || type === 'application/pdf';

        if (isPdf) {
            return (
                <WebView
                    source={{ uri: googleDocsUrl }}
                    style={styles.webview}
                    startInLoadingState
                    scalesPageToFit
                />
            );
        }

        if (isImage) {
            // Already handled by specific image render function below in main return, 
            // but kept here for fallback structure logic if needed.
            return renderImageContent();
        }

        if (isVideo) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Video
                        style={styles.video}
                        source={{ uri: url }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping
                        shouldPlay
                    />
                </View>
            );
        }

        // Default WebView
        return (
            <WebView
                source={{ uri: url }}
                style={styles.webview}
                startInLoadingState
                scalesPageToFit
            />
        );
    };

    // Refined Render for Image to support Zoom buttons properly
    const renderImageContent = () => (
        <View style={styles.zoomWrapper}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                maximumZoomScale={3}
                minimumZoomScale={1}
                centerContent
                scrollEnabled={scale > 1}
            >
                <Animated.View style={{ transform: [{ scale }] }}>
                    <Image
                        source={{ uri: url }}
                        style={{ width: width, height: height * 0.8 }}
                        contentFit="contain"
                    />
                </Animated.View>
            </ScrollView>
        </View>
    );

    const ext = url.split('.').pop()?.toLowerCase();
    const isImage = type?.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext || '');

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Immersive Black Background */}
                <View style={styles.backdrop} />

                {/* Main Content */}
                <View style={styles.content}>
                    {isImage ? renderImageContent() : renderContent()}
                </View>

                {/* Floating Header */}
                <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                    <View style={styles.header}>
                        <Text style={styles.title} numberOfLines={1}>{name || 'Attachment'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                            <X color="#fff" size={24} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                {/* Floating Footer Controls (Only for Images) */}
                {isImage && (
                    <SafeAreaView style={styles.footerSafeArea} edges={['bottom']}>
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={handleZoomOut} style={styles.controlBtn}>
                                <ZoomOut color="#fff" size={24} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleReset} style={styles.controlBtn}>
                                {scale === 1 ? <Maximize color="#fff" size={20} /> : <Minimize color="#fff" size={20} />}
                                <Text style={styles.scaleText}>{Math.round(scale * 100)}%</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleZoomIn} style={styles.controlBtn}>
                                <ZoomIn color="#fff" size={24} />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Floating Header
    headerSafeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 20,
    },
    title: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        maxWidth: '80%',
        opacity: 0.9,
    },
    iconBtn: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },

    // Floating Footer
    footerSafeArea: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        zIndex: 20,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30,30,30,0.8)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        gap: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    controlBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    scaleText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },

    // Content Styles
    zoomWrapper: {
        flex: 1,
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: width,
        height: 300,
    },
    webview: {
        width: width,
        flex: 1,
        backgroundColor: 'transparent',
    }
});
