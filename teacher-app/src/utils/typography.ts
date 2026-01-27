import { Text, TextInput } from 'react-native';

export const typography = {
    regular: 'Oswald',
    medium: 'Oswald-Bold', // Make "Medium" actually Bold for the user's "Thick" request
    bold: 'Oswald-Bold',
};

export const setGlobalTypography = () => {
    const defaultTextStyles = {
        fontFamily: 'Oswald',
        color: '#020617',
        fontSize: 16,
    };

    const defaultInputStyles = {
        fontFamily: 'Oswald',
        color: '#020617',
    };

    // @ts-ignore
    if (Text.defaultProps == null) Text.defaultProps = {};
    // @ts-ignore
    Text.defaultProps.style = [defaultTextStyles, Text.defaultProps.style];
    // @ts-ignore
    Text.defaultProps.allowFontScaling = false;

    // @ts-ignore
    if (TextInput.defaultProps == null) TextInput.defaultProps = {};
    // @ts-ignore
    TextInput.defaultProps.style = [defaultInputStyles, TextInput.defaultProps.style];
};
