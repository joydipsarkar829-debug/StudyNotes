import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import Button from './Button';

interface EmptySubjectProps {
  onAction?: () => void;
  actionTitle?: string;
}

const EmptySubject: React.FC<EmptySubjectProps> = ({
  onAction,
  actionTitle = 'Add Subject',
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
          name="school"
          size={52}
          color={theme.colors.primary}
        />
      </View>
      <Text
        style={[
          styles.title,
          { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.semibold },
        ]}
      >
        No Subjects Yet
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
        ]}
      >
        Create your first subject to start organizing your study notes.
      </Text>
      {onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="md"
          icon="plus"
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
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    minWidth: 180,
  },
});

export default React.memo(EmptySubject);
