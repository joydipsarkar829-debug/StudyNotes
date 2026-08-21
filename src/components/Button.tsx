import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const theme = useTheme();

  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const sizes = {
      sm: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md },
      md: { paddingVertical: theme.spacing.sm + 2, paddingHorizontal: theme.spacing.lg },
      lg: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.xl },
    };

    const variants: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: isDisabled ? theme.colors.disabled : theme.colors.primary,
      },
      secondary: {
        backgroundColor: isDisabled ? theme.colors.disabled : theme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: isDisabled ? theme.colors.disabled : theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: isDisabled ? theme.colors.disabled : theme.colors.error,
      },
    };

    return { ...base, ...sizes[size], ...variants[variant] };
  };

  const getTextColor = (): string => {
    if (isDisabled) return theme.colors.surface;
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const sizes = {
    sm: theme.fontSize.sm,
    md: theme.fontSize.md,
    lg: theme.fontSize.lg,
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18}
              color={getTextColor()}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: sizes[size], fontWeight: theme.fontWeight.semibold },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
});

export default React.memo(Button);
