import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color,
  style,
}) => {
  const theme = useTheme();
  const accentColor = color || theme.colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 1,
        },
        style,
      ]}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: accentColor + '15', borderRadius: theme.borderRadius.md },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={24}
          color={accentColor}
        />
      </View>
      <Text
        style={[
          styles.value,
          { color: theme.colors.text, fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: {
    marginBottom: 4,
  },
  label: {},
});

export default React.memo(StatCard);
