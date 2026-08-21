import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text,
  size = 'large',
  color,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={text || 'Loading'}>
      <ActivityIndicator
        size={size}
        color={color || theme.colors.primary}
      />
      {text && (
        <Text
          style={[
            styles.text,
            { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
          ]}
        >
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    marginTop: 12,
  },
});

export default React.memo(LoadingSpinner);
