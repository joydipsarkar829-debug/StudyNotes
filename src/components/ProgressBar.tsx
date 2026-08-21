import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 8,
  showLabel = false,
  animated = true,
}) => {
  const theme = useTheme();
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const barColor = color || theme.colors.primary;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, animatedWidth]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityValue={{ now: clampedProgress, min: 0, max: 100 }}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: barColor,
              borderRadius: height / 2,
              width: widthInterpolated as any,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Animated.Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.xs,
            },
          ]}
        >
          {Math.round(animatedWidth.__getValue())}%
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  label: {
    marginTop: 4,
    textAlign: 'right',
  },
});

export default React.memo(ProgressBar);
