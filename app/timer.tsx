import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Vibration,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useTimerStore } from '@/store/useTimerStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import Header from '@/components/Header';
import TimerDisplay from '@/components/TimerDisplay';
import Button from '@/components/Button';
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import { TIMER_PRESETS } from '@/constants';
import type { StudySession } from '@/types';

type TimerMode = 'pomodoro' | 'short' | 'long' | 'custom';

const MODE_CONFIG: Record<TimerMode, { label: string; duration: number; icon: string }> = {
  pomodoro: { label: 'Pomodoro', duration: TIMER_PRESETS.pomodoro.workDuration * 60, icon: 'brain' },
  short: { label: 'Short Break', duration: TIMER_PRESETS.pomodoro.breakDuration * 60, icon: 'coffee' },
  long: { label: 'Long Break', duration: TIMER_PRESETS.pomodoro.longBreakDuration * 60, icon: 'weather-sunny' },
  custom: { label: 'Custom', duration: 0, icon: 'tune-variant' },
};

function formatSessionTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

export default function TimerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    isRunning,
    isPaused,
    secondsRemaining,
    totalSeconds,
    currentSubjectId,
    sessions,
    dailyMinutes,
    weeklyMinutes,
    streak,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeSession,
    loadSessions,
    setCurrentSubject,
  } = useTimerStore();
  const { subjects, loadSubjects } = useSubjectStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedMode, setSelectedMode] = useState<TimerMode>('pomodoro');
  const [customHours, setCustomHours] = useState('0');
  const [customMinutes, setCustomMinutes] = useState('25');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [completedMessage, setCompletedMessage] = useState(false);

  useEffect(() => {
    loadSessions();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        const { secondsRemaining: remaining, completeSession: complete } =
          useTimerStore.getState();
        if (remaining <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          Vibration.vibrate([0, 500, 200, 500]);
          complete();
          setCompletedMessage(true);
          setTimeout(() => setCompletedMessage(false), 3000);
        } else {
          useTimerStore.getState().setSecondsRemaining(remaining - 1);
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused]);

  const handleStart = useCallback(() => {
    let duration: number;
    if (selectedMode === 'custom') {
      const h = parseInt(customHours, 10) || 0;
      const m = parseInt(customMinutes, 10) || 0;
      duration = h * 3600 + m * 60;
    } else {
      duration = MODE_CONFIG[selectedMode].duration;
    }
    if (duration <= 0) return;
    startTimer(duration, currentSubjectId ?? undefined);
  }, [selectedMode, customHours, customMinutes, currentSubjectId]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) resumeTimer();
    else pauseTimer();
  }, [isPaused]);

  const handleReset = useCallback(() => {
    resetTimer();
    setCompletedMessage(false);
  }, []);

  const handleSelectSubject = useCallback(
    (id: string | null) => {
      setCurrentSubject(id);
      setShowSubjectPicker(false);
    },
    []
  );

  const selectedSubject = subjects.find((s) => s.id === currentSubjectId);
  const recentSessions = sessions.slice(0, 5);
  const totalSessionCount = sessions.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Study Timer"
        showBack
        onBack={() => {
          if (isRunning) resetTimer();
          router.back();
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TimerDisplay
          seconds={secondsRemaining}
          total={totalSeconds}
          isRunning={isRunning && !isPaused}
        />

        {completedMessage && (
          <View
            style={[
              styles.completedBanner,
              {
                backgroundColor: theme.colors.successLight,
                borderRadius: theme.borderRadius.md,
                borderColor: theme.colors.success,
              },
            ]}
            accessibilityLabel="Session completed"
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={theme.colors.success}
            />
            <Text
              style={[
                styles.completedText,
                { color: theme.colors.success, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
              ]}
            >
              Session completed! Great work.
            </Text>
          </View>
        )}

        <SectionHeader title="Timer Mode" />
        <View style={styles.modeRow}>
          {(Object.keys(MODE_CONFIG) as TimerMode[]).map((mode) => {
            const cfg = MODE_CONFIG[mode];
            const isActive = selectedMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeChip,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                onPress={() => !isRunning && setSelectedMode(mode)}
                disabled={isRunning}
                accessibilityLabel={`Select ${cfg.label} mode`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive, disabled: isRunning }}
              >
                <MaterialCommunityIcons
                  name={cfg.icon as any}
                  size={16}
                  color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.modeChipText,
                    {
                      color: isActive ? '#FFFFFF' : theme.colors.text,
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.medium,
                    },
                  ]}
                >
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedMode === 'custom' && !isRunning && (
          <View style={styles.customInputRow}>
            <View style={styles.customInputGroup}>
              <Text
                style={[
                  styles.customLabel,
                  { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
                ]}
              >
                Hours
              </Text>
              <TextInput
                style={[
                  styles.customInput,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSize.xl,
                  },
                ]}
                keyboardType="number-pad"
                value={customHours}
                onChangeText={(t) => setCustomHours(t.replace(/[^0-9]/g, ''))}
                maxLength={2}
                accessibilityLabel="Custom hours"
              />
            </View>
            <Text
              style={[
                styles.customSeparator,
                { color: theme.colors.textMuted, fontSize: theme.fontSize.xxl },
              ]}
            >
              :
            </Text>
            <View style={styles.customInputGroup}>
              <Text
                style={[
                  styles.customLabel,
                  { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
                ]}
              >
                Minutes
              </Text>
              <TextInput
                style={[
                  styles.customInput,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSize.xl,
                  },
                ]}
                keyboardType="number-pad"
                value={customMinutes}
                onChangeText={(t) => setCustomMinutes(t.replace(/[^0-9]/g, ''))}
                maxLength={2}
                accessibilityLabel="Custom minutes"
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.subjectSelector,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.md,
            },
          ]}
          onPress={() => !isRunning && setShowSubjectPicker(!showSubjectPicker)}
          disabled={isRunning}
          accessibilityLabel={`Subject: ${selectedSubject?.name || 'None selected'}`}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="book-outline"
            size={18}
            color={theme.colors.textMuted}
          />
          <Text
            style={[
              styles.subjectText,
              {
                color: selectedSubject ? theme.colors.text : theme.colors.textMuted,
                fontSize: theme.fontSize.md,
              },
            ]}
          >
            {selectedSubject ? selectedSubject.name : 'Select subject (optional)'}
          </Text>
          <MaterialCommunityIcons
            name={showSubjectPicker ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.textMuted}
          />
        </TouchableOpacity>

        {showSubjectPicker && !isRunning && (
          <View
            style={[
              styles.subjectPicker,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.subjectOption,
                { borderBottomColor: theme.colors.borderLight },
              ]}
              onPress={() => handleSelectSubject(null)}
              accessibilityLabel="No subject"
              accessibilityRole="radio"
              accessibilityState={{ checked: !currentSubjectId }}
            >
              <Text
                style={[
                  styles.subjectOptionText,
                  { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
                ]}
              >
                None
              </Text>
              {!currentSubjectId && (
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectOption,
                  { borderBottomColor: theme.colors.borderLight },
                ]}
                onPress={() => handleSelectSubject(subject.id)}
                accessibilityLabel={subject.name}
                accessibilityRole="radio"
                accessibilityState={{ checked: currentSubjectId === subject.id }}
              >
                <View style={styles.subjectOptionLeft}>
                  <View
                    style={[
                      styles.subjectDot,
                      { backgroundColor: subject.color, borderRadius: theme.borderRadius.full },
                    ]}
                  />
                  <Text
                    style={[
                      styles.subjectOptionText,
                      { color: theme.colors.text, fontSize: theme.fontSize.md },
                    ]}
                  >
                    {subject.name}
                  </Text>
                </View>
                {currentSubjectId === subject.id && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.controlRow}>
          {!isRunning ? (
            <Button
              title="Start"
              onPress={handleStart}
              icon="play"
              size="lg"
              style={styles.controlButton}
            />
          ) : (
            <>
              <Button
                title="Reset"
                onPress={handleReset}
                variant="outline"
                icon="restart"
                size="md"
                style={styles.controlButton}
              />
              <Button
                title={isPaused ? 'Resume' : 'Pause'}
                onPress={handlePauseResume}
                variant={isPaused ? 'primary' : 'secondary'}
                icon={isPaused ? 'play' : 'pause'}
                size="lg"
                style={styles.controlButton}
              />
            </>
          )}
        </View>

        <SectionHeader title="Today's Stats" />
        <View style={styles.statsGrid}>
          <StatCard
            icon="clock-outline"
            value={`${dailyMinutes}m`}
            label="Today"
            color={theme.colors.primary}
            style={styles.statCard}
          />
          <StatCard
            icon="calendar-week"
            value={`${weeklyMinutes}m`}
            label="This Week"
            color={theme.colors.secondary}
            style={styles.statCard}
          />
          <StatCard
            icon="fire"
            value={streak}
            label="Day Streak"
            color={theme.colors.warning}
            style={styles.statCard}
          />
          <StatCard
            icon="counter"
            value={totalSessionCount}
            label="Sessions"
            color={theme.colors.success}
            style={styles.statCard}
          />
        </View>

        <SectionHeader title="Recent Sessions" />
        {recentSessions.length === 0 ? (
          <EmptyState
            icon="timer-sand-empty"
            title="No sessions yet"
            subtitle="Start a timer to begin tracking your study time"
          />
        ) : (
          <View style={styles.sessionsList}>
            {recentSessions.map((session: StudySession) => {
              const subject = subjects.find((s) => s.id === session.subjectId);
              const mins = Math.floor(session.duration / 60);
              return (
                <View
                  key={session.id}
                  style={[
                    styles.sessionRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.md,
                      borderBottomColor: theme.colors.borderLight,
                    },
                  ]}
                  accessibilityLabel={`${mins} minute session at ${formatSessionTime(session.startedAt)}`}
                >
                  <View style={styles.sessionLeft}>
                    <MaterialCommunityIcons
                      name={session.type === 'pomodoro' ? 'brain' : 'coffee'}
                      size={18}
                      color={subject?.color || theme.colors.primary}
                    />
                    <View style={styles.sessionInfo}>
                      <Text
                        style={[
                          styles.sessionSubject,
                          {
                            color: theme.colors.text,
                            fontSize: theme.fontSize.md,
                            fontWeight: theme.fontWeight.medium,
                          },
                        ]}
                      >
                        {subject?.name || 'General'}
                      </Text>
                      <Text
                        style={[
                          styles.sessionTime,
                          {
                            color: theme.colors.textMuted,
                            fontSize: theme.fontSize.xs,
                          },
                        ]}
                      >
                        {formatSessionTime(session.startedAt)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.sessionDuration,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.fontSize.md,
                        fontWeight: theme.fontWeight.semibold,
                      },
                    ]}
                  >
                    {mins}m
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  completedText: {
    flex: 1,
  },
  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  modeChipText: {
    textAlign: 'center',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  customInputGroup: {
    alignItems: 'center',
  },
  customLabel: {
    marginBottom: 4,
  },
  customInput: {
    width: 80,
    height: 56,
    borderWidth: 1,
    textAlign: 'center',
  },
  customSeparator: {
    marginTop: 18,
  },
  subjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 10,
  },
  subjectText: {
    flex: 1,
  },
  subjectPicker: {
    marginHorizontal: 16,
    marginTop: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subjectOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subjectDot: {
    width: 10,
    height: 10,
  },
  subjectOptionText: {},
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  controlButton: {
    minWidth: 140,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  sessionsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionSubject: {},
  sessionTime: {
    marginTop: 2,
  },
  sessionDuration: {},
});
