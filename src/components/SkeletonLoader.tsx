import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}) => {
  const theme = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const computedBorderRadius = borderRadius ?? theme.borderRadius.sm;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: width as any,
          height: height as any,
          borderRadius: computedBorderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel="Loading"
    />
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default React.memo(SkeletonLoader);
