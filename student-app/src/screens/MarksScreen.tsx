import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function MarksScreen() {
    return (
        <View style={styles.container}>
            <Text>Marks Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }
});
