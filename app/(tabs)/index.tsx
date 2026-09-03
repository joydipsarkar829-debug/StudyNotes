import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  type TextStyle,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useNoteStore } from '@/store/useNoteStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import { useTimerStore } from '@/store/useTimerStore';
import StatCard from '@/components/StatCard';
import NoteCard from '@/components/NoteCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import { getGreeting, formatMinutes, getRelativeTime } from '@/utils';
import { APP_NAME } from '@/constants';
import type { Note, StudySession } from '@/types';

interface QuickAction {
  key: string;
  label: string;
  icon: string;
  color: string;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'addNote', label: 'New Note', icon: 'note-plus', color: '#4A90D9', route: '/note/create' },
  { key: 'addSubject', label: 'Subjects', icon: 'folder-plus', color: '#7C5CFC', route: '/subject/create' },
  { key: 'timer', label: 'Timer', icon: 'timer-outline', color: '#F39C12', route: '/timer' },
  { key: 'search', label: 'Search', icon: 'magnify', color: '#2ECC71', route: '/search' },
  { key: 'revision', label: 'Revise', icon: 'brain', color: '#9B59B6', route: '/revision' },
  { key: 'favorites', label: 'Favorites', icon: 'heart', color: '#E74C3C', route: '/favorites' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { notes, loadNotes, loadRecent, loadFavorites, loadImportant, loadBookmarked } =
    useNoteStore();
  const { subjects, stats, loadSubjects } = useSubjectStore();
  const { sessions, loadSessions, streak, dailyMinutes } = useTimerStore();

  const [refreshing, setRefreshing] = useState(false);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [favorites, setFavorites] = useState<Note[]>([]);
  const [importantCount, setImportantCount] = useState(0);
  const [bookmarkedCount, setBookmarkedCount] = useState(0);
  const [lastSession, setLastSession] = useState<StudySession | null>(null);

  const loadData = useCallback(() => {
    loadNotes();
    loadSubjects();
    loadSessions();
    const recent = loadRecent(5);
    setRecentNotes(recent);
    const favs = loadFavorites();
    setFavorites(favs);
    const important = loadImportant();
    setImportantCount(important.length);
    const bookmarked = loadBookmarked();
    setBookmarkedCount(bookmarked.length);
  }, [loadNotes, loadSubjects, loadSessions, loadRecent, loadFavorites, loadImportant, loadBookmarked]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (sessions.length > 0) {
      setLastSession(sessions[0]);
    }
  }, [sessions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const getSubjectName = useCallback(
    (subjectId: string): string => {
      const subject = subjects.find((s) => s.id === subjectId);
      return subject?.name ?? '';
    },
    [subjects],
  );

  const hasData = notes.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          paddingBottom: 40,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: Platform.OS === 'ios' ? 48 : 16,
          paddingBottom: 4,
        },
        headerLeft: {
          flex: 1,
        },
        greetingText: {
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.medium as TextStyle['fontWeight'],
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 2,
        },
        titleText: {
          color: theme.colors.text,
          fontSize: theme.fontSize.xxl,
          fontWeight: theme.fontWeight.bold as TextStyle['fontWeight'],
          flex: 1,
        },
        headerActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        headerIconBtn: {
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: theme.colors.surfaceVariant,
          justifyContent: 'center',
          alignItems: 'center',
        },
        statsRow: {
          flexDirection: 'row',
          paddingHorizontal: 12,
          marginTop: 8,
        },
        statCardWrapper: {
          flex: 1,
        },
        streakContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginTop: 14,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: 16,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        streakIconContainer: {
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: '#FFF3E0',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 14,
        },
        streakInfo: {
          flex: 1,
        },
        streakLabel: {
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.sm,
        },
        streakValue: {
          color: theme.colors.text,
          fontSize: theme.fontSize.lg,
          fontWeight: theme.fontWeight.bold as TextStyle['fontWeight'],
          marginTop: 2,
        },
        studyTimeContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.successLight,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        studyTimeText: {
          color: theme.colors.success,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold as TextStyle['fontWeight'],
          marginLeft: 6,
        },
        actionsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 12,
          marginTop: 4,
        },
        actionItem: {
          width: '33.33%',
          paddingVertical: 6,
        },
        actionButton: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          marginHorizontal: 4,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        },
        actionIconWrapper: {
          width: 44,
          height: 44,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        },
        actionLabel: {
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.medium as TextStyle['fontWeight'],
          color: theme.colors.textSecondary,
          textAlign: 'center',
        },
        sectionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          marginTop: 20,
          marginBottom: 8,
        },
        sectionTitle: {
          color: theme.colors.text,
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.semibold as TextStyle['fontWeight'],
        },
        sectionAction: {
          color: theme.colors.primary,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.medium as TextStyle['fontWeight'],
        },
        continueContainer: {
          marginHorizontal: 16,
          marginTop: 4,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: 16,
          borderLeftWidth: 4,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        continueLabel: {
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.medium as TextStyle['fontWeight'],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 6,
        },
        continueTitle: {
          color: theme.colors.text,
          fontSize: theme.fontSize.lg,
          fontWeight: theme.fontWeight.semibold as TextStyle['fontWeight'],
          marginBottom: 4,
        },
        continueMeta: {
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.sm,
        },
        continueRight: {
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 12,
        },
        recentNotesContainer: {
          paddingHorizontal: 4,
        },
        activityContainer: {
          marginHorizontal: 16,
        },
        activityItem: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: 14,
          marginBottom: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1,
        },
        activityIconContainer: {
          width: 40,
          height: 40,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        },
        activityInfo: {
          flex: 1,
        },
        activityTitle: {
          color: theme.colors.text,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold as TextStyle['fontWeight'],
        },
        activitySubtitle: {
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.xs,
          marginTop: 2,
        },
        activityTime: {
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.xs,
          marginLeft: 8,
        },
      }),
    [theme],
  );

  if (!hasData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText} accessibilityLabel={getGreeting()}>
              {getGreeting()}
            </Text>
            <Text
              style={styles.titleText}
              accessibilityLabel={APP_NAME}
              accessibilityRole="header"
            >
              {APP_NAME}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/settings' as any)}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={22}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <EmptyState
          icon="notebook-plus"
          title="Start Your Study Journey"
          subtitle="Create your first note to begin organizing your study materials effectively."
          actionTitle="Create Your First Note"
          onAction={() => router.push('/note/create' as any)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText} accessibilityLabel={getGreeting()}>
              {getGreeting()}
            </Text>
            <View style={styles.titleRow}>
              <Text
                style={styles.titleText}
                accessibilityLabel={APP_NAME}
                accessibilityRole="header"
              >
                {APP_NAME}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/search' as any)}
              accessibilityLabel="Search"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/settings' as any)}
              accessibilityLabel="Settings"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={22}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCardWrapper}>
            <StatCard
              icon="folder-multiple"
              value={stats.totalSubjects}
              label="Subjects"
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard
              icon="note-text"
              value={stats.totalNotes}
              label="Notes"
              color={theme.colors.secondary}
            />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard
              icon="alert-circle"
              value={importantCount}
              label="Important"
              color={theme.colors.warning}
            />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard
              icon="bookmark"
              value={bookmarkedCount}
              label="Saved"
              color={theme.colors.error}
            />
          </View>
        </View>

        <View style={styles.streakContainer} accessibilityLabel={`Study streak: ${streak} days. Today's study time: ${formatMinutes(dailyMinutes)}`}>
          <View style={styles.streakIconContainer}>
            <MaterialCommunityIcons name="fire" size={26} color="#FF6D00" />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>Study Streak</Text>
            <Text style={styles.streakValue}>
              {streak} {streak === 1 ? 'day' : 'days'}
            </Text>
          </View>
          <View style={styles.studyTimeContainer} accessibilityLabel={`Today: ${formatMinutes(dailyMinutes)}`}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={theme.colors.success}
            />
            <Text style={styles.studyTimeText}>{formatMinutes(dailyMinutes)}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <View key={action.key} style={styles.actionItem}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(action.route as any)}
                accessibilityLabel={action.label}
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIconWrapper,
                    { backgroundColor: action.color + '15' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={action.icon as any}
                    size={22}
                    color={action.color}
                  />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {lastSession && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Studying</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.continueContainer,
                { borderLeftColor: theme.colors.primary },
              ]}
              onPress={() => {
                if (lastSession.subjectId) {
                  router.push(`/subject/${lastSession.subjectId}` as any);
                }
              }}
              accessibilityLabel={`Continue studying. Last session: ${getRelativeTime(lastSession.startedAt)}`}
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.continueLabel}>LAST STUDY SESSION</Text>
                <Text style={styles.continueTitle} numberOfLines={1}>
                  {lastSession.subjectId
                    ? getSubjectName(lastSession.subjectId) || 'Study Session'
                    : 'Study Session'}
                </Text>
                <Text style={styles.continueMeta}>
                  {formatMinutes(Math.floor(lastSession.duration / 60))} · {getRelativeTime(lastSession.startedAt)}
                </Text>
              </View>
              <View style={styles.continueRight}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.textMuted}
                />
              </View>
            </TouchableOpacity>
          </>
        )}

        {recentNotes.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Added</Text>
              <TouchableOpacity
                onPress={() => router.push('/notes' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionAction}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentNotes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <NoteCard
                  note={item}
                  subjectName={getSubjectName(item.subjectId)}
                  onPress={() => router.push(`/note/${item.id}` as any)}
                />
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.recentNotesContainer}
            />
          </>
        )}

        {sessions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <View style={styles.activityContainer}>
              {sessions.slice(0, 4).map((session) => {
                const isPomodoro = session.type === 'pomodoro';
                const isRevision = session.type === 'revision';
                const iconName = isPomodoro
                  ? 'timer'
                  : isRevision
                    ? 'brain'
                    : 'book-open-variant';
                const iconBgColor = isPomodoro
                  ? theme.colors.warningLight
                  : isRevision
                    ? theme.colors.infoLight
                    : theme.colors.successLight;
                const iconColor = isPomodoro
                  ? theme.colors.warning
                  : isRevision
                    ? theme.colors.info
                    : theme.colors.success;

                return (
                  <View
                    key={session.id}
                    style={styles.activityItem}
                    accessibilityLabel={`${session.type} session, ${formatMinutes(Math.floor(session.duration / 60))}, ${getRelativeTime(session.startedAt)}`}
                  >
                    <View
                      style={[
                        styles.activityIconContainer,
                        { backgroundColor: iconBgColor },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={iconName as any}
                        size={18}
                        color={iconColor}
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {session.subjectId
                          ? getSubjectName(session.subjectId) || 'Study Session'
                          : 'Study Session'}
                      </Text>
                      <Text style={styles.activitySubtitle}>
                        {session.type.charAt(0).toUpperCase() + session.type.slice(1)} ·{' '}
                        {formatMinutes(Math.floor(session.duration / 60))}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {getRelativeTime(session.startedAt)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
