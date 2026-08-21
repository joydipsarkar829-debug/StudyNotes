import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
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
import NoteCard from '@/components/NoteCard';
import EmptyState from '@/components/EmptyState';
import FAB from '@/components/FAB';
import ProgressBar from '@/components/ProgressBar';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Button from '@/components/Button';
import type { Chapter, Note, Subject } from '@/types';

export default function ChapterDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { chapters, loadChapters, updateChapter, deleteChapter } = useSubjectStore();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const loadData = useCallback(() => {
    if (!id) return;
    const raw = db.getChapterById(id);
    if (raw) {
      const mapped: Chapter = {
        id: raw.id,
        subjectId: raw.subject_id,
        title: raw.title,
        description: raw.description,
        isCompleted: raw.is_completed === 1,
        progress: raw.progress,
        sortOrder: raw.sort_order,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      };
      setChapter(mapped);
      loadChapters(mapped.subjectId);
      const subjectRaw = db.getSubjectById(mapped.subjectId);
      if (subjectRaw) {
        setSubject({
          id: subjectRaw.id,
          name: subjectRaw.name,
          description: subjectRaw.description,
          icon: subjectRaw.icon,
          color: subjectRaw.color,
          isArchived: subjectRaw.is_archived === 1,
          sortOrder: subjectRaw.sort_order,
          createdAt: subjectRaw.created_at,
          updatedAt: subjectRaw.updated_at,
        });
      }
    }
    const rawNotes = db.getNotesByChapter(id);
    const mappedNotes: Note[] = rawNotes.map((n: any) => ({
      id: n.id,
      subjectId: n.subject_id,
      chapterId: n.chapter_id,
      title: n.title,
      content: n.content,
      type: n.type,
      tags: db.getTagsByNote(n.id).map((t: any) => t.name),
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
    loadData();
  }, [chapters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleToggleCompletion = useCallback(() => {
    if (!chapter) return;
    const next = !chapter.isCompleted;
    db.markChapterCompleted(chapter.id, next);
    setChapter((prev) => (prev ? { ...prev, isCompleted: next } : prev));
  }, [chapter]);

  const handleOpenEdit = useCallback(() => {
    if (!chapter) return;
    setEditTitle(chapter.title);
    setEditDescription(chapter.description);
    setShowEditModal(true);
    setShowMenu(false);
  }, [chapter]);

  const handleSaveEdit = useCallback(() => {
    if (!chapter || !editTitle.trim()) return;
    updateChapter(chapter.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
    });
    setShowEditModal(false);
    loadData();
  }, [chapter, editTitle, editDescription, updateChapter, loadData]);

  const handleDelete = useCallback(() => {
    if (!chapter) return;
    deleteChapter(chapter.id);
    setShowDeleteDialog(false);
    router.back();
  }, [chapter, deleteChapter, router]);

  const handleAddNote = useCallback(() => {
    if (!chapter) return;
    router.push(`/note/editor?chapterId=${chapter.id}&subjectId=${chapter.subjectId}` as any);
  }, [chapter, router]);

  const progressPercent = useMemo(() => {
    if (!chapter) return 0;
    if (notes.length === 0) return chapter.progress;
    return Math.min(100, Math.round((notes.filter((n) => n.isFavorite || n.isBookmarked).length / notes.length) * 100));
  }, [chapter, notes]);

  const displayProgress = chapter?.progress ?? 0;

  if (!chapter) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Chapter" showBack onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.md }}>
            Chapter not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={chapter.title}
        subtitle={subject?.name}
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
              onPress={handleOpenEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit chapter"
            >
              <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.text} />
              <Text style={[styles.menuText, { color: theme.colors.text, fontSize: theme.fontSize.md }]}>
                Edit Chapter
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowDeleteDialog(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Delete chapter"
            >
              <MaterialCommunityIcons name="delete" size={20} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error, fontSize: theme.fontSize.md }]}>
                Delete Chapter
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            subjectName={subject?.name}
            onPress={() => router.push(`/note/${item.id}` as any)}
          />
        )}
        ListHeaderComponent={
          <View>
            <View
              style={[
                styles.chapterInfo,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                  shadowColor: theme.colors.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 1,
                },
              ]}
            >
              <View style={styles.chapterInfoHeader}>
                <View style={styles.chapterInfoText}>
                  <Text
                    style={[
                      styles.chapterTitle,
                      { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
                    ]}
                    numberOfLines={2}
                  >
                    {chapter.title}
                  </Text>
                  {chapter.description ? (
                    <Text
                      style={[
                        styles.chapterDescription,
                        { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
                      ]}
                      numberOfLines={3}
                    >
                      {chapter.description}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: chapter.isCompleted ? theme.colors.successLight : theme.colors.surfaceVariant,
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={chapter.isCompleted ? 'check-circle' : 'clock-outline'}
                    size={16}
                    color={chapter.isCompleted ? theme.colors.success : theme.colors.textMuted}
                  />
                  <Text
                    style={{
                      color: chapter.isCompleted ? theme.colors.success : theme.colors.textMuted,
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                      marginLeft: 4,
                    }}
                  >
                    {chapter.isCompleted ? 'Completed' : 'In Progress'}
                  </Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    Progress
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.semibold,
                    }}
                  >
                    {displayProgress}%
                  </Text>
                </View>
                <ProgressBar progress={displayProgress} />
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: chapter.isCompleted ? theme.colors.surfaceVariant : theme.colors.primaryLight,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: chapter.isCompleted ? theme.colors.border : theme.colors.primary + '30',
                  },
                ]}
                onPress={handleToggleCompletion}
                accessibilityRole="button"
                accessibilityLabel={chapter.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
              >
                <MaterialCommunityIcons
                  name={chapter.isCompleted ? 'undo' : 'check-circle-outline'}
                  size={20}
                  color={chapter.isCompleted ? theme.colors.textSecondary : theme.colors.primary}
                />
                <Text
                  style={{
                    color: chapter.isCompleted ? theme.colors.textSecondary : theme.colors.primary,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                    marginLeft: 8,
                  }}
                >
                  {chapter.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notesHeader}>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.bold,
                }}
              >
                Notes
              </Text>
              <Text
                style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.sm,
                }}
              >
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="note-text-outline"
            title="No Notes Yet"
            subtitle="Add your first note to this chapter"
            actionTitle="Add Note"
            onAction={handleAddNote}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />

      <FAB icon="plus" onPress={handleAddNote} accessibilityLabel="Add new note" />

      <Modal visible={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Chapter">
        <Input
          label="Title"
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Chapter title"
          leftIcon="format-title"
        />
        <Input
          label="Description"
          value={editDescription}
          onChangeText={setEditDescription}
          placeholder="Optional description"
          leftIcon="text"
          multiline
        />
        <View style={styles.editActions}>
          <Button
            title="Cancel"
            onPress={() => setShowEditModal(false)}
            variant="outline"
            size="md"
            style={styles.editButton}
          />
          <Button
            title="Save"
            onPress={handleSaveEdit}
            variant="primary"
            size="md"
            disabled={!editTitle.trim()}
            style={styles.editButton}
          />
        </View>
      </Modal>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Chapter"
        message={`Are you sure you want to delete "${chapter.title}"? All notes in this chapter will also be deleted. This action cannot be undone.`}
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
  listContent: {
    paddingBottom: 100,
  },
  chapterInfo: {
    margin: 16,
    padding: 16,
  },
  chapterInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chapterInfoText: {
    flex: 1,
    marginRight: 12,
  },
  chapterTitle: {},
  chapterDescription: {
    marginTop: 6,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
  },
});
