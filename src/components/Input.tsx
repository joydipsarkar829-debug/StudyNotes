import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  leftIcon,
  rightIcon,
  multiline = false,
  secureTextEntry = false,
  style,
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);

  const getBorderColor = (): string => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: isFocused || error ? 1.5 : 1,
          },
          multiline && { minHeight: 100, alignItems: multiline ? 'flex-start' : 'center' },
        ]}
      >
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon as any}
            size={20}
            color={error ? theme.colors.error : theme.colors.textMuted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.fontSize.md,
              flex: 1,
            },
            multiline && { textAlignVertical: 'top', paddingTop: theme.spacing.sm },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          multiline={multiline}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label || placeholder}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecureVisible(!isSecureVisible)}
            style={styles.rightIcon}
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
          >
            <MaterialCommunityIcons
              name={isSecureVisible ? 'eye-off' : 'eye'}
              size={20}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        )}
        {!secureTextEntry && rightIcon && (
          <MaterialCommunityIcons
            name={rightIcon as any}
            size={20}
            color={error ? theme.colors.error : theme.colors.textMuted}
            style={styles.rightIcon}
          />
        )}
      </View>
      {error && (
        <Text
          style={[styles.error, { color: theme.colors.error, fontSize: theme.fontSize.xs }]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    padding: 0,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
    padding: 2,
  },
  error: {
    marginTop: 4,
    marginLeft: 4,
  },
});

export default React.memo(Input);
