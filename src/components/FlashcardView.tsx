import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface FlashcardViewProps {
  question: string;
  answer: string;
  isFlipped: boolean;
  onFlip: () => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({
  question,
  answer,
  isFlipped,
  onFlip,
}) => {
  const theme = useTheme();
  const flipProgress = useSharedValue(0);

  useEffect(() => {
    flipProgress.value = withTiming(isFlipped ? 1 : 0, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isFlipped, flipProgress]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    const opacity = interpolate(flipProgress.value, [0, 0.5, 1], [1, 0, 0]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [-180, 0]);
    const opacity = interpolate(flipProgress.value, [0, 0.5, 1], [0, 0, 1]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  return (
    <TouchableOpacity
      onPress={onFlip}
      activeOpacity={0.9}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`Flashcard. ${isFlipped ? 'Answer' : 'Question'}. Tap to flip.`}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          },
          frontStyle,
          styles.absoluteCard,
        ]}
      >
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
            ]}
          >
            QUESTION
          </Text>
        </View>
        <Text
          style={[
            styles.text,
            { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.medium },
          ]}
        >
          {question}
        </Text>
        <View style={styles.flipHint}>
          <MaterialCommunityIcons
            name="rotate-3d-variant"
            size={20}
            color={theme.colors.textMuted}
          />
          <Text
            style={[
              styles.flipHintText,
              { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
            ]}
          >
            Tap to reveal answer
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.primaryLight,
            borderRadius: theme.borderRadius.xl,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          },
          backStyle,
          styles.absoluteCard,
        ]}
      >
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
            ]}
          >
            ANSWER
          </Text>
        </View>
        <Text
          style={[
            styles.text,
            { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.medium },
          ]}
        >
          {answer}
        </Text>
        <View style={styles.flipHint}>
          <MaterialCommunityIcons
            name="rotate-3d-variant"
            size={20}
            color={theme.colors.textMuted}
          />
          <Text
            style={[
              styles.flipHintText,
              { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
            ]}
          >
            Tap to see question
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
  },
  absoluteCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  labelContainer: {
    marginBottom: 16,
  },
  label: {
    letterSpacing: 2,
  },
  text: {
    textAlign: 'center',
    lineHeight: 28,
    flex: 1,
    textAlignVertical: 'center',
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  flipHintText: {
    marginLeft: 6,
  },
});

export default React.memo(FlashcardView);
