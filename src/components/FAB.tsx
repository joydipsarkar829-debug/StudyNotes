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
          borderRadius: 18,
          shadowColor: fabColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 8,
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
        size={26}
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(FAB);
