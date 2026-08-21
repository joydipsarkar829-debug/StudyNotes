import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/store/useSubjectStore';
import { useTimerStore } from '@/store/useTimerStore';
import { useQuizStore } from '@/store/useQuizStore';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import { db } from '@/database';
import type { StudySession } from '@/types';

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export default function StatisticsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { subjects, stats: subjectStats, loadSubjects } = useSubjectStore();
  const { sessions, loadSessions } = useTimerStore();
  const { quizHistory, loadQuizHistory } = useQuizStore();

  const [completedChapters, setCompletedChapters] = useState(0);
  const [notesThisWeek, setNotesThisWeek] = useState(0);

  useEffect(() => {
    loadSubjects();
    loadSessions();
    loadQuizHistory();
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      const allNotes = db.getAllNotes();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentNotes = allNotes.filter((n: any) => n.created_at >= weekAgo);
      setNotesThisWeek(recentNotes.length);

      let chapters = 0;
      subjects.forEach((s) => {
        const chaps = db.getChaptersBySubject(s.id);
        chapters += chaps.filter((c: any) => c.is_completed === 1).length;
      });
      setCompletedChapters(chapters);
    } catch {
      setCompletedChapters(0);
      setNotesThisWeek(0);
    }
  };

  useEffect(() => {
    loadStats();
  }, [subjects]);

  const totalNotes = subjectStats.totalNotes;
  const totalSubjects = subjectStats.totalSubjects;

  const todayStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  }, []);

  const weekStart = useMemo(() => {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }, []);

  const monthStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }, []);

  const todayMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.startedAt >= todayStart)
        .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0),
    [sessions, todayStart]
  );

  const weekMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.startedAt >= weekStart)
        .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0),
    [sessions, weekStart]
  );

  const monthMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.startedAt >= monthStart)
        .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0),
    [sessions, monthStart]
  );

  const totalMinutes = useMemo(
    () => sessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0),
    [sessions]
  );

  const streak = useMemo(() => {
    let count = 0;
    const dayMs = 24 * 60 * 60 * 1000;
    let checkDate = new Date();
    checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

    for (let i = 0; i < 365; i++) {
      const dayStr = checkDate.toISOString();
      const prevDayStr = new Date(checkDate.getTime() - dayMs).toISOString();
      const hasSession = sessions.some(
        (s) => s.startedAt >= prevDayStr && s.startedAt < dayStr
      );
      if (!hasSession && i > 0) break;
      if (hasSession) count++;
      checkDate = new Date(checkDate.getTime() - dayMs);
    }
    return count;
  }, [sessions]);

  const barData = useMemo(() => {
    const bars: { label: string; minutes: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * dayMs);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
      const dayEnd = new Date(day.getTime() + dayMs).toISOString();
      const dayMinutes = sessions
        .filter((s) => s.startedAt >= dayStart && s.startedAt < dayEnd)
        .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);
      bars.push({
        label: getDayLabel(day),
        minutes: dayMinutes,
      });
    }
    return bars;
  }, [sessions]);

  const maxBarMinutes = useMemo(() => Math.max(...barData.map((b) => b.minutes), 1), [barData]);

  const mostStudiedSubject = useMemo(() => {
    const subjectCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.subjectId) {
        subjectCounts[s.subjectId] = (subjectCounts[s.subjectId] || 0) + 1;
      }
    });
    const topId = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topId) return null;
    const subject = subjects.find((s) => s.id === topId);
    const count = subjectCounts[topId];
    return subject ? { subject, count } : null;
  }, [sessions, subjects]);

  const recentSessions = useMemo(() => sessions.slice(0, 10), [sessions]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Statistics"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <StatCard
            icon="note-text"
            value={totalNotes}
            label="Total Notes"
            color={theme.colors.primary}
            style={styles.statCard}
          />
          <StatCard
            icon="book-open-variant"
            value={totalSubjects}
            label="Subjects"
            color={theme.colors.secondary}
            style={styles.statCard}
          />
          <StatCard
            icon="clock-outline"
            value={sessions.length}
            label="Sessions"
            color={theme.colors.success}
            style={styles.statCard}
          />
          <StatCard
            icon="fire"
            value={streak}
            label="Day Streak"
            color={theme.colors.warning}
            style={styles.statCard}
          />
        </View>

        <SectionHeader title="Study Time" />
        <View style={styles.timeCards}>
          <View
            style={[
              styles.timeCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <View style={styles.timeCardRow}>
              <MaterialCommunityIcons name="calendar-today" size={18} color={theme.colors.primary} />
              <Text style={[styles.timeCardLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
                Today
              </Text>
            </View>
            <Text style={[styles.timeCardValue, { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold }]}>
              {formatTime(todayMinutes)}
            </Text>
          </View>
          <View
            style={[
              styles.timeCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <View style={styles.timeCardRow}>
              <MaterialCommunityIcons name="calendar-week" size={18} color={theme.colors.secondary} />
              <Text style={[styles.timeCardLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
                This Week
              </Text>
            </View>
            <Text style={[styles.timeCardValue, { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold }]}>
              {formatTime(weekMinutes)}
            </Text>
          </View>
          <View
            style={[
              styles.timeCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <View style={styles.timeCardRow}>
              <MaterialCommunityIcons name="calendar-month" size={18} color={theme.colors.success} />
              <Text style={[styles.timeCardLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
                This Month
              </Text>
            </View>
            <Text style={[styles.timeCardValue, { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold }]}>
              {formatTime(monthMinutes)}
            </Text>
          </View>
          <View
            style={[
              styles.timeCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <View style={styles.timeCardRow}>
              <MaterialCommunityIcons name="chart-line" size={18} color={theme.colors.warning} />
              <Text style={[styles.timeCardLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
                All Time
              </Text>
            </View>
            <Text style={[styles.timeCardValue, { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold }]}>
              {formatTime(totalMinutes)}
            </Text>
          </View>
        </View>

        <SectionHeader title="Last 7 Days" />
        <View
          style={[
            styles.chartContainer,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
        >
          <View style={styles.chartBars}>
            {barData.map((bar, idx) => (
              <View key={idx} style={styles.barColumn}>
                <Text
                  style={[
                    styles.barValue,
                    { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },
                  ]}
                >
                  {bar.minutes > 0 ? `${bar.minutes}m` : ''}
                </Text>
                <View
                  style={[
                    styles.barTrack,
                    { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.sm },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: bar.minutes > 0 ? theme.colors.primary : theme.colors.surfaceVariant,
                        borderRadius: theme.borderRadius.sm,
                        height: `${bar.minutes > 0 ? Math.max((bar.minutes / maxBarMinutes) * 100, 4) : 2}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
                  ]}
                >
                  {bar.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <SectionHeader title="Most Studied Subject" />
        {mostStudiedSubject ? (
          <View
            style={[
              styles.mostStudiedCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <View
              style={[
                styles.mostStudiedIcon,
                {
                  backgroundColor: mostStudiedSubject.subject.color + '15',
                  borderRadius: theme.borderRadius.md,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={mostStudiedSubject.subject.icon as any}
                size={24}
                color={mostStudiedSubject.subject.color}
              />
            </View>
            <View style={styles.mostStudiedInfo}>
              <Text
                style={[
                  styles.mostStudiedName,
                  {
                    color: theme.colors.text,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                  },
                ]}
              >
                {mostStudiedSubject.subject.name}
              </Text>
              <Text
                style={[
                  styles.mostStudiedCount,
                  { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
                ]}
              >
                {mostStudiedSubject.count} sessions
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.emptySmall,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
              No study sessions yet
            </Text>
          </View>
        )}

        <SectionHeader title="Quick Stats" />
        <View style={styles.quickStats}>
          <View
            style={[
              styles.quickStatItem,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <MaterialCommunityIcons name="check-decagram" size={20} color={theme.colors.success} />
            <Text style={[styles.quickStatValue, { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold }]}>
              {completedChapters}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
              Chapters Done
            </Text>
          </View>
          <View
            style={[
              styles.quickStatItem,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <MaterialCommunityIcons name="note-plus-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.quickStatValue, { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold }]}>
              {notesThisWeek}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
              Notes This Week
            </Text>
          </View>
          <View
            style={[
              styles.quickStatItem,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={20} color={theme.colors.info} />
            <Text style={[styles.quickStatValue, { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold }]}>
              {quizHistory.length}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
              Quizzes Taken
            </Text>
          </View>
        </View>

        <SectionHeader title="Recent Activity" />
        {recentSessions.length === 0 ? (
          <EmptyState
            icon="timer-sand-empty"
            title="No activity yet"
            subtitle="Start studying to see your activity here"
          />
        ) : (
          <View style={styles.activityList}>
            {recentSessions.map((session) => {
              const subject = subjects.find((s) => s.id === session.subjectId);
              const mins = Math.floor(session.duration / 60);
              return (
                <View
                  key={session.id}
                  style={[
                    styles.activityItem,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  accessibilityLabel={`${mins} minute ${subject?.name || 'general'} session`}
                >
                  <View
                    style={[
                      styles.activityIcon,
                      {
                        backgroundColor: (subject?.color || theme.colors.primary) + '15',
                        borderRadius: theme.borderRadius.sm,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={(subject?.icon || 'brain') as any}
                      size={16}
                      color={subject?.color || theme.colors.primary}
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text
                      style={[
                        styles.activitySubject,
                        {
                          color: theme.colors.text,
                          fontSize: theme.fontSize.sm,
                          fontWeight: theme.fontWeight.medium,
                        },
                      ]}
                    >
                      {subject?.name || 'General'}
                    </Text>
                    <Text
                      style={[
                        styles.activityDate,
                        { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
                      ]}
                    >
                      {formatSessionDate(session.startedAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.activityDuration,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.fontSize.sm,
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
  scrollContent: {
    paddingBottom: 40,
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
  timeCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  timeCard: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
  },
  timeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  timeCardLabel: {},
  timeCardValue: {},
  chartContainer: {
    marginHorizontal: 16,
    padding: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barValue: {
    marginBottom: 4,
    minHeight: 14,
  },
  barTrack: {
    width: '100%',
    height: 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
  },
  barLabel: {
    marginTop: 6,
  },
  mostStudiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 14,
    gap: 12,
  },
  mostStudiedIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mostStudiedInfo: {
    flex: 1,
  },
  mostStudiedName: {},
  mostStudiedCount: {
    marginTop: 2,
  },
  emptySmall: {
    marginHorizontal: 16,
    padding: 20,
    alignItems: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  quickStatItem: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  quickStatValue: {},
  quickStatLabel: {},
  activityList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activitySubject: {},
  activityDate: {
    marginTop: 2,
  },
  activityDuration: {},
});
