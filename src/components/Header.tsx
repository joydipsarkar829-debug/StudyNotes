import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface HeaderAction {
  icon: string;
  onPress: () => void;
  label?: string;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightActions?: HeaderAction[];
  showBack?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightActions,
  showBack = false,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingTop: Platform.OS === 'ios' ? 48 : 12,
        },
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.iconButton, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md }]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.bold,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSize.sm,
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightActions}>
          {rightActions?.map((action, i) => (
            <TouchableOpacity
              key={i}
              onPress={action.onPress}
              style={[styles.iconButton, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md }]}
              accessibilityLabel={action.label || action.icon}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name={action.icon as any}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightPress}
              style={[styles.iconButton, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md }]}
              accessibilityLabel={rightIcon}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name={rightIcon as any}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          {!rightIcon && !rightActions && <View style={styles.spacer} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  titleContainer: {
    flex: 1,
  },
  title: {},
  subtitle: {
    marginTop: 2,
  },
  spacer: {
    width: 40,
    height: 40,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(Header);
