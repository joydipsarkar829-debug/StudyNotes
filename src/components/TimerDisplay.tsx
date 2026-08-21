import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface TimerDisplayProps {
  seconds: number;
  total: number;
  isRunning?: boolean;
  isBreak?: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  seconds,
  total,
  isRunning = false,
  isBreak = false,
}) => {
  const theme = useTheme();

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const progress = total > 0 ? ((total - seconds) / total) * 100 : 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const accentColor = isBreak ? theme.colors.success : theme.colors.primary;

  return (
    <View style={styles.container} accessibilityLabel={`${minutes} minutes ${secs} seconds remaining`}>
      <View
        style={[
          styles.circle,
          {
            width: radius * 2 + 24,
            height: radius * 2 + 24,
            borderRadius: radius + 12,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.time,
              {
                color: theme.colors.text,
                fontSize: theme.fontSize.xxxl,
                fontWeight: theme.fontWeight.bold,
              },
            ]}
          >
            {timeString}
          </Text>
          <Text
            style={[
              styles.status,
              {
                color: accentColor,
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.semibold,
              },
            ]}
          >
            {isBreak ? 'Break' : isRunning ? 'Focus' : 'Paused'}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.track,
            { height: 4, backgroundColor: theme.colors.surfaceVariant, borderRadius: 2 },
          ]}
        >
          <View
            style={[
              styles.fill,
              {
                width: `${progress}%`,
                height: 4,
                backgroundColor: accentColor,
                borderRadius: 2,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  innerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  time: {
    letterSpacing: 2,
  },
  status: {
    marginTop: 4,
  },
  progressBar: {
    width: 200,
    marginTop: 24,
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default React.memo(TimerDisplay);
