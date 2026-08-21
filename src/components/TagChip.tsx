import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface TagChipProps {
  name: string;
  color?: string;
  onPress?: () => void;
  onRemove?: () => void;
  selected?: boolean;
}

const TagChip: React.FC<TagChipProps> = ({
  name,
  color,
  onPress,
  onRemove,
  selected = false,
}) => {
  const theme = useTheme();
  const chipColor = color || theme.colors.primary;

  const containerStyle = {
    backgroundColor: selected ? chipColor : theme.colors.surfaceVariant,
    borderColor: selected ? chipColor : theme.colors.border,
  };

  const textStyle = {
    color: selected ? '#FFFFFF' : theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium as string,
  };

  const content = (
    <View style={[styles.container, { borderRadius: theme.borderRadius.full, borderWidth: 1 }, containerStyle]}>
      <Text style={[styles.text, textStyle]} numberOfLines={1}>
        {name}
      </Text>
      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Remove ${name}`}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={16}
            color={selected ? '#FFFFFF' : theme.colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={name}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  text: {
    marginRight: 4,
  },
});

export default React.memo(TagChip);
