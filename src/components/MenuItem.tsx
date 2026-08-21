import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  chevron?: boolean;
  color?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  chevron = true,
  color,
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.textSecondary;

  const content = (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: (color || theme.colors.primary) + '12', borderRadius: theme.borderRadius.sm },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={iconColor}
        />
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {chevron && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.colors.textMuted}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={title}
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
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {},
  subtitle: {
    marginTop: 2,
    lineHeight: 18,
  },
});

export default React.memo(MenuItem);
