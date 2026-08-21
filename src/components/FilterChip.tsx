import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
}) => {
  const theme = useTheme();

  const containerStyle = {
    backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant,
    borderColor: selected ? theme.colors.primary : theme.colors.border,
  };

  const textStyle = {
    color: selected ? '#FFFFFF' : theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as string,
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderRadius: theme.borderRadius.full, borderWidth: 1 },
        containerStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={16}
          color={selected ? '#FFFFFF' : theme.colors.textMuted}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {},
});

export default React.memo(FilterChip);
