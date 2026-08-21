import React from 'react';
import { TouchableOpacity, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface FABProps {
  icon: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  color,
  style,
}) => {
  const theme = useTheme();
  const fabColor = color || theme.colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: fabColor,
          borderRadius: theme.borderRadius.xl,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={icon.replace('-', ' ')}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={28}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(FAB);
