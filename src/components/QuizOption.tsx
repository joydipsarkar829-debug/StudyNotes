import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface QuizOptionProps {
  text: string;
  selected?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

const QuizOption: React.FC<QuizOptionProps> = ({
  text,
  selected = false,
  correct = false,
  incorrect = false,
  onPress,
  disabled = false,
}) => {
  const theme = useTheme();

  const getContainerStyle = () => {
    if (correct) {
      return {
        backgroundColor: theme.colors.successLight,
        borderColor: theme.colors.success,
      };
    }
    if (incorrect) {
      return {
        backgroundColor: theme.colors.errorLight,
        borderColor: theme.colors.error,
      };
    }
    if (selected) {
      return {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary,
      };
    }
    return {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    };
  };

  const getTextColor = () => {
    if (correct) return theme.colors.success;
    if (incorrect) return theme.colors.error;
    if (selected) return theme.colors.primary;
    return theme.colors.text;
  };

  const getIcon = () => {
    if (correct) return 'check-circle';
    if (incorrect) return 'close-circle';
    if (selected) return 'radiobox-marked';
    return 'radiobox-blank';
  };

  const containerStyle = getContainerStyle();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderRadius: theme.borderRadius.md,
          borderWidth: 1.5,
        },
        containerStyle,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={text}
    >
      <MaterialCommunityIcons
        name={getIcon() as any}
        size={22}
        color={getTextColor()}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.medium,
          },
        ]}
        numberOfLines={3}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginBottom: 10,
  },
  icon: {
    marginRight: 12,
    marginTop: 1,
  },
  text: {
    flex: 1,
    lineHeight: 22,
  },
});

export default React.memo(QuizOption);
