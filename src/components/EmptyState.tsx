import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import Button from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionTitle,
  onAction,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container} accessibilityRole="text">
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.xl },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={48}
          color={theme.colors.primary}
        />
      </View>
      <Text
        style={[
          styles.title,
          { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.semibold },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
          ]}
        >
          {subtitle}
        </Text>
      )}
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    minWidth: 160,
  },
});

export default React.memo(EmptyState);
