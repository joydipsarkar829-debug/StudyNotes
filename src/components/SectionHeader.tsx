import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface SectionHeaderProps {
  title: string;
  actionTitle?: string;
  onAction?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionTitle,
  onAction,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { paddingHorizontal: 16, paddingVertical: 12 }]}>
      <Text
        style={[
          styles.title,
          { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold },
        ]}
      >
        {title}
      </Text>
      {actionTitle && onAction && (
        <TouchableOpacity
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionTitle}
        >
          <Text
            style={[
              styles.action,
              { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
            ]}
          >
            {actionTitle}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {},
  action: {},
});

export default React.memo(SectionHeader);
