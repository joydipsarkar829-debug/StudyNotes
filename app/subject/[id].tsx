import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/store/useSubjectStore';
import { db } from '@/database';
import Header from '@/components/Header';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import NoteCard from '@/components/NoteCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import ProgressBar from '@/components/ProgressBar';
import Button from '@/components/Button';
import type { Chapter, Note, Subject } from '@/types';

export default function SubjectDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { chapters, loadChapters, deleteSubject, archiveSubject, deleteChapter } =
    useSubjectStore();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const loadData = useCallback(() => {
    if (!id) return;
    const raw = db.getSubjectById(id);
    if (raw) {
      setSubject({
        id: raw.id,
        name: raw.name,
        description: raw.description,
        icon: raw.icon,
        color: raw.color,
        isArchived: raw.is_archived === 1,
        sortOrder: raw.sort_order,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      });
    }
    loadChapters(id);
    const rawNotes = db.getNotesBySubject(id);
    const mappedNotes: Note[] = rawNotes.map((n: any) => ({
      id: n.id,
      subjectId: n.subject_id,
      chapterId: n.chapter_id,
      title: n.title,
      content: n.content,
      type: n.type,
      tags: [],
      isFavorite: n.is_favorite === 1,
      isBookmarked: n.is_bookmarked === 1,
      isPinned: n.is_pinned === 1,
      isImportant: n.is_important === 1,
      isArchived: n.is_archived === 1,
      attachments: [],
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));
    setNotes(mappedNotes);
  }, [id, loadChapters]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = router.events?.()?.subscribe?.(() => {});
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    loadData();
  }, [chapters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    deleteSubject(id);
    setShowDeleteDialog(false);
    router.back();
  }, [id, deleteSubject, router]);

  const handleArchive = useCallback(() => {
    if (!id) return;
    archiveSubject(id);
    setShowMenu(false);
    router.back();
  }, [id, archiveSubject, router]);

  const handleToggleComplete = useCallback(
    (chapterId: string, current: boolean) => {
      db.markChapterCompleted(chapterId, !current);
      loadData();
    },
    [loadData]
  );

  const completedCount = useMemo(
    () => chapters.filter((c) => c.isCompleted).length,
    [chapters]
  );

  const progress = useMemo(
    () => (chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0),
    [completedCount, chapters.length]
  );

  if (!subject) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Subject" showBack onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.md }}>
            Subject not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={subject.name}
        showBack
        onBack={() => router.back()}
        rightIcon="dots-vertical"
        onRightPress={() => setShowMenu(!showMenu)}
      />

      {showMenu && (
        <>
          <TouchableOpacity
            style={styles.menuOverlay}
            onPress={() => setShowMenu(false)}
            activeOpacity={1}
          />
          <View
            style={[
              styles.menuDropdown,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push(`/subject/new?id=${id}` as any);
              }}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.text} />
              <Text style={[styles.menuText, { color: theme.colors.text, fontSize: theme.fontSize.md }]}>
                Edit Subject
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleArchive}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="archive" size={20} color={theme.colors.text} />
              <Text style={[styles.menuText, { color: theme.colors.text, fontSize: theme.fontSize.md }]}>
                Archive Subject
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowDeleteDialog(true);
              }}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="delete" size={20} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error, fontSize: theme.fontSize.md }]}>
                Delete Subject
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

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
        <View
          style={[
            styles.subjectInfo,
            {
              backgroundColor: theme.colors.surface,
              borderLeftColor: subject.color,
            },
          ]}
        >
          <View
            style={[
              styles.subjectIconLarge,
              { backgroundColor: subject.color + '20' },
            ]}
          >
            <MaterialCommunityIcons
              name={subject.icon as any}
              size={36}
              color={subject.color}
            />
          </View>
          <View style={styles.subjectInfoText}>
            <Text
              style={[
                styles.subjectName,
                { color: theme.colors.text, fontSize: theme.fontSize.xl },
              ]}
            >
              {subject.name}
            </Text>
            {subject.description ? (
              <Text
                style={[
                  styles.subjectDesc,
                  { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
                ]}
              >
                {subject.description}
              </Text>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.statsRow,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                { color: theme.colors.text, fontSize: theme.fontSize.xxl },
              ]}
            >
              {chapters.length}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
              ]}
            >
              Chapters
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                { color: theme.colors.text, fontSize: theme.fontSize.xxl },
              ]}
            >
              {notes.length}
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
              ]}
            >
              Notes
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                { color: subject.color, fontSize: theme.fontSize.xxl },
              ]}
            >
              {progress}%
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
              ]}
            >
              Progress
            </Text>
          </View>
        </View>

        <SectionHeader
          title="Chapters"
          actionTitle="Add"
          onAction={() => {
            Alert.prompt?.(
              'New Chapter',
              'Enter chapter title',
              (title: string) => {
                if (title.trim()) {
                  useSubjectStore.getState().createChapter({
                    subjectId: id!,
                    title: title.trim(),
                  });
                  loadData();
                }
              }
            );
            if (!Alert.prompt) {
              const newChapter = useSubjectStore.getState().createChapter({
                subjectId: id!,
                title: 'New Chapter',
              });
              if (newChapter) {
                loadData();
                router.push(`/chapter/${newChapter.id}` as any);
              }
            }
          }}
        />

        {chapters.length === 0 ? (
          <View style={styles.emptyChapters}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={40}
              color={theme.colors.textMuted}
            />
            <Text
              style={[
                styles.emptyChaptersText,
                { color: theme.colors.textMuted, fontSize: theme.fontSize.md },
              ]}
            >
              No chapters yet
            </Text>
          </View>
        ) : (
          chapters.map((chapter) => {
            const chapterNotes = db.getNotesByChapter(chapter.id);
            return (
              <TouchableOpacity
                key={chapter.id}
                style={[
                  styles.chapterCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderLeftColor: chapter.isCompleted
                      ? theme.colors.success
                      : subject.color,
                  },
                ]}
                onPress={() => router.push(`/chapter/${chapter.id}` as any)}
                onLongPress={() =>
                  Alert.alert('Delete Chapter', `Delete "${chapter.title}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        deleteChapter(chapter.id);
                        loadData();
                      },
                    },
                  ])
                }
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    {
                      borderColor: chapter.isCompleted
                        ? theme.colors.success
                        : theme.colors.border,
                      backgroundColor: chapter.isCompleted
                        ? theme.colors.success
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleToggleComplete(chapter.id, chapter.isCompleted)}
                  accessibilityLabel={
                    chapter.isCompleted ? 'Mark incomplete' : 'Mark complete'
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: chapter.isCompleted }}
                >
                  {chapter.isCompleted && (
                    <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <View style={styles.chapterContent}>
                  <Text
                    style={[
                      styles.chapterTitle,
                      {
                        color: theme.colors.text,
                        fontSize: theme.fontSize.md,
                        textDecorationLine: chapter.isCompleted ? 'line-through' : 'none',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {chapter.title}
                  </Text>
                  {chapter.description ? (
                    <Text
                      style={[
                        styles.chapterDesc,
                        { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },
                      ]}
                      numberOfLines={1}
                    >
                      {chapter.description}
                    </Text>
                  ) : null}
                  <View style={styles.chapterMeta}>
                    <MaterialCommunityIcons
                      name="note-text"
                      size={14}
                      color={theme.colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.chapterMetaText,
                        { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
                      ]}
                    >
                      {chapterNotes.length} {chapterNotes.length === 1 ? 'note' : 'notes'}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            );
          })
        )}

        {notes.length > 0 && (
          <>
            <SectionHeader title="Notes in this Subject" />
            {notes.slice(0, 5).map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={() => router.push(`/note/${note.id}` as any)}
              />
            ))}
            {notes.length > 5 && (
              <TouchableOpacity
                style={styles.seeAllNotes}
                onPress={() => router.push('/notes' as any)}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                  }}
                >
                  See all {notes.length} notes
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomActions,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button
          title="Add Chapter"
          onPress={() => {
            const newChapter = useSubjectStore.getState().createChapter({
              subjectId: id!,
              title: 'New Chapter',
            });
            if (newChapter) {
              loadData();
              router.push(`/chapter/${newChapter.id}` as any);
            }
          }}
          variant="outline"
          size="md"
          icon="plus"
          style={styles.bottomButton}
        />
        <Button
          title="Add Note"
          onPress={() => router.push('/note/editor' as any)}
          variant="primary"
          size="md"
          icon="note-plus"
          style={styles.bottomButton}
        />
      </View>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Subject"
        message={`Are you sure you want to delete "${subject.name}"? This will also delete all chapters and notes in this subject. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
  menuDropdown: {
    position: 'absolute',
    top: 80,
    right: 16,
    zIndex: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 12,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  subjectIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInfoText: {
    flex: 1,
    marginLeft: 16,
  },
  subjectName: {
    fontWeight: '700',
  },
  subjectDesc: {
    marginTop: 4,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
  },
  statLabel: {
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  emptyChapters: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyChaptersText: {
    marginTop: 12,
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterContent: {
    flex: 1,
  },
  chapterTitle: {
    fontWeight: '600',
  },
  chapterDesc: {
    marginTop: 2,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  chapterMetaText: {
    marginLeft: 4,
  },
  seeAllNotes: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  bottomButton: {
    flex: 1,
  },
});
