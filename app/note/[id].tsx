import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/theme';
import { useNoteStore } from '@/store/useNoteStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import { db } from '@/database';
import Header from '@/components/Header';
import NoteTypeBadge from '@/components/NoteTypeBadge';
import TagChip from '@/components/TagChip';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Note } from '@/types';

export default function NoteReaderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { currentNote, setCurrentNote, toggleFavorite, toggleBookmark, togglePin, toggleImportant, deleteNote, loadNotes } =
    useNoteStore();
  const { subjects, chapters, loadSubjects, loadChapters } = useSubjectStore();

  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadNote = useCallback(() => {
    if (!id) return;
    const raw = db.getNoteById(id);
    if (raw) {
      const tags = db.getTagsByNote(id).map((t) => t.name);
      const note: Note = {
        id: raw.id,
        subjectId: raw.subject_id ?? '',
        chapterId: raw.chapter_id,
        title: raw.title,
        content: raw.content,
        type: raw.type as Note['type'],
        tags,
        isFavorite: raw.is_favorite === 1,
        isBookmarked: raw.is_bookmarked === 1,
        isPinned: raw.is_pinned === 1,
        isImportant: raw.is_important === 1,
        isArchived: raw.is_archived === 1,
        attachments: [],
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      };
      setCurrentNote(note);
      setNoteTags(tags);
    }
  }, [id, setCurrentNote]);

  useEffect(() => {
    loadSubjects();
    loadNote();
  }, []);

  useEffect(() => {
    if (currentNote?.subjectId) {
      loadChapters(currentNote.subjectId);
    }
  }, [currentNote?.subjectId]);

  useEffect(() => {
    loadNote();
  }, [id]);

  const subjectName = subjects.find((s) => s.id === currentNote?.subjectId)?.name;
  const chapterName = chapters.find((c) => c.id === currentNote?.chapterId)?.title;

  const handleBack = useCallback(() => {
    loadNotes();
    router.back();
  }, [router, loadNotes]);

  const handleEdit = useCallback(() => {
    router.push(`/note/editor?id=${id}`);
  }, [router, id]);

  const handleToggleFavorite = useCallback(() => {
    if (id) toggleFavorite(id);
  }, [id, toggleFavorite]);

  const handleToggleBookmark = useCallback(() => {
    if (id) toggleBookmark(id);
  }, [id, toggleBookmark]);

  const handleTogglePin = useCallback(() => {
    if (id) togglePin(id);
  }, [id, togglePin]);

  const handleToggleImportant = useCallback(() => {
    if (id) toggleImportant(id);
  }, [id, toggleImportant]);

  const handleShare = useCallback(async () => {
    if (!currentNote) return;
    try {
      await Share.share({
        message: `${currentNote.title}\n\n${currentNote.content}`,
        title: currentNote.title,
      });
    } catch {}
  }, [currentNote]);

  const handleCopy = useCallback(async () => {
    if (!currentNote) return;
    await Clipboard.setStringAsync(currentNote.content);
    Alert.alert('Copied', 'Note content copied to clipboard.');
  }, [currentNote]);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (id) {
      deleteNote(id);
      loadNotes();
      router.back();
    }
    setShowDeleteDialog(false);
  }, [id, deleteNote, loadNotes, router]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentNote) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Note" showBack onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Read Note" showBack onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: theme.fontSize.xxl,
              fontWeight: theme.fontWeight.bold as any,
            },
          ]}
        >
          {currentNote.title}
        </Text>

        {(subjectName || chapterName) && (
          <View style={styles.metaRow}>
            {subjectName && (
              <View style={[styles.metaBadge, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.sm }]}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium as any },
                  ]}
                >
                  {subjectName}
                </Text>
              </View>
            )}
            {chapterName && (
              <View style={[styles.metaBadge, { backgroundColor: theme.colors.secondaryLight, borderRadius: theme.borderRadius.sm }]}>
                <MaterialCommunityIcons
                  name="bookmark-outline"
                  size={14}
                  color={theme.colors.secondary}
                />
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.secondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium as any },
                  ]}
                >
                  {chapterName}
                </Text>
              </View>
            )}
          </View>
        )}

        {noteTags.length > 0 && (
          <View style={styles.tagsRow}>
            {noteTags.map((tag) => (
              <TagChip key={tag} name={tag} />
            ))}
          </View>
        )}

        <View style={styles.typeBadgeRow}>
          <NoteTypeBadge type={currentNote.type} />
        </View>

        <View
          style={[
            styles.contentCard,
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
          <Text
            style={[
              styles.content,
              {
                color: theme.colors.text,
                fontSize: theme.fontSize.md,
                lineHeight: theme.fontSize.md * 1.7,
              },
            ]}
          >
            {currentNote.content || 'No content'}
          </Text>
        </View>

        <View style={styles.datesContainer}>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons
              name="calendar-plus"
              size={16}
              color={theme.colors.textMuted}
            />
            <Text
              style={[
                styles.dateLabel,
                { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
              ]}
            >
              Created
            </Text>
            <Text
              style={[
                styles.dateValue,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
              ]}
            >
              {formatDate(currentNote.createdAt)}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons
              name="calendar-edit"
              size={16}
              color={theme.colors.textMuted}
            />
            <Text
              style={[
                styles.dateLabel,
                { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
              ]}
            >
              Updated
            </Text>
            <Text
              style={[
                styles.dateValue,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
              ]}
            >
              {formatDate(currentNote.updatedAt)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleEdit}
          accessibilityLabel="Edit note"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="pencil" size={22} color={theme.colors.primary} />
          <Text style={[styles.actionLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleFavorite}
          accessibilityLabel={currentNote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name={currentNote.isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={currentNote.isFavorite ? theme.colors.error : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.actionLabel,
              {
                color: currentNote.isFavorite ? theme.colors.error : theme.colors.textSecondary,
                fontSize: theme.fontSize.xs,
              },
            ]}
          >
            Favorite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleBookmark}
          accessibilityLabel={currentNote.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name={currentNote.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={currentNote.isBookmarked ? theme.colors.info : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.actionLabel,
              {
                color: currentNote.isBookmarked ? theme.colors.info : theme.colors.textSecondary,
                fontSize: theme.fontSize.xs,
              },
            ]}
          >
            Bookmark
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTogglePin}
          accessibilityLabel={currentNote.isPinned ? 'Unpin note' : 'Pin note'}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name={currentNote.isPinned ? 'pin' : 'pin-outline'}
            size={22}
            color={currentNote.isPinned ? theme.colors.warning : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.actionLabel,
              {
                color: currentNote.isPinned ? theme.colors.warning : theme.colors.textSecondary,
                fontSize: theme.fontSize.xs,
              },
            ]}
          >
            Pin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleImportant}
          accessibilityLabel={currentNote.isImportant ? 'Remove important' : 'Mark important'}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name={currentNote.isImportant ? 'star' : 'star-outline'}
            size={22}
            color={currentNote.isImportant ? theme.colors.warning : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.actionLabel,
              {
                color: currentNote.isImportant ? theme.colors.warning : theme.colors.textSecondary,
                fontSize: theme.fontSize.xs,
              },
            ]}
          >
            Important
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
          accessibilityLabel="Share note"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="share-variant" size={22} color={theme.colors.textSecondary} />
          <Text style={[styles.actionLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
            Share
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCopy}
          accessibilityLabel="Copy content"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="content-copy" size={22} color={theme.colors.textSecondary} />
          <Text style={[styles.actionLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
            Copy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          accessibilityLabel="Delete note"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="delete-outline" size={22} color={theme.colors.error} />
          <Text style={[styles.actionLabel, { color: theme.colors.error, fontSize: theme.fontSize.xs }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Note"
        message={`Are you sure you want to delete "${currentNote.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  metaText: {},
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeBadgeRow: {
    marginBottom: 16,
  },
  contentCard: {
    padding: 20,
    marginBottom: 20,
  },
  content: {},
  datesContainer: {
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    width: 60,
  },
  dateValue: {
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  actionLabel: {},
});
