import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '@/components/Header';
import FilterChip from '@/components/FilterChip';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import { useTheme } from '@/theme';
import { useNoteStore } from '@/store/useNoteStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import { db } from '@/database';
import type { Note } from '@/types';

type SessionStep = 'select' | 'reading' | 'summary';
type FilterMode = 'all' | 'favorites' | 'important' | 'subject' | 'tag';

export default function RevisionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { loadNotes, toggleFavorite, toggleBookmark } = useNoteStore();
  const { subjects, loadSubjects } = useSubjectStore();

  const [step, setStep] = useState<SessionStep>('select');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState<Note[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revisedIds, setRevisedIds] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => db.getAllTags(), []);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    const notes = db.getAllNotes();
    for (const note of notes) {
      const tags = db.getTagsByNote(note.id);
      for (const t of tags) tagSet.add(t.name);
    }
    return Array.from(tagSet).sort();
  }, []);

  const filteredNotes = useMemo((): Note[] => {
    let rawNotes: any[] = [];
    switch (filterMode) {
      case 'favorites':
        rawNotes = db.getFavoriteNotes();
        break;
      case 'important':
        rawNotes = db.getImportantNotes();
        break;
      case 'subject':
        if (selectedSubjectId) {
          rawNotes = db.getNotesBySubject(selectedSubjectId);
        }
        break;
      case 'tag': {
        if (selectedTag) {
          const tag = allTags.find((t) => t.name === selectedTag);
          if (tag) rawNotes = db.getNotesByTag(tag.id);
        }
        break;
      }
      default:
        rawNotes = db.getAllNotes();
    }
    const tagsMap = new Map<string, string[]>();
    const attachMap = new Map<string, any[]>();
    return rawNotes.map((n) => {
      if (!tagsMap.has(n.id)) {
        tagsMap.set(
          n.id,
          db.getTagsByNote(n.id).map((t) => t.name)
        );
      }
      if (!attachMap.has(n.id)) {
        attachMap.set(
          n.id,
          db.getAttachmentsByNote(n.id).map((a) => ({
            id: a.id,
            noteId: a.note_id,
            type: a.type,
            uri: a.uri,
            name: a.name,
            size: a.size,
            mimeType: a.mime_type,
            createdAt: a.created_at,
          }))
        );
      }
      return {
        id: n.id,
        subjectId: n.subject_id,
        chapterId: n.chapter_id,
        title: n.title,
        content: n.content,
        type: n.type,
        tags: tagsMap.get(n.id) || [],
        isFavorite: n.is_favorite === 1,
        isBookmarked: n.is_bookmarked === 1,
        isPinned: n.is_pinned === 1,
        isImportant: n.is_important === 1,
        isArchived: n.is_archived === 1,
        attachments: attachMap.get(n.id) || [],
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      } as Note;
    });
  }, [filterMode, selectedSubjectId, selectedTag, allTags]);

  const currentNote = sessionNotes[currentIndex] ?? null;
  const canStart = filteredNotes.length > 0;

  const getSubjectName = useCallback(
    (subjectId: string) => {
      const sub = subjects.find((s) => s.id === subjectId);
      return sub?.name ?? '';
    },
    [subjects]
  );

  const handleStart = useCallback(() => {
    setSessionNotes(filteredNotes);
    setCurrentIndex(0);
    setRevisedIds(new Set());
    setStep('reading');
  }, [filteredNotes]);

  const handleEnd = useCallback(() => {
    for (const noteId of Array.from(revisedIds)) {
      db.createRevisionEntry(noteId, true);
    }
    for (const note of sessionNotes) {
      if (!revisedIds.has(note.id)) {
        db.createRevisionEntry(note.id, false);
      }
    }
    setStep('summary');
  }, [revisedIds, sessionNotes]);

  const handleNewSession = useCallback(() => {
    setStep('select');
    setSessionNotes([]);
    setCurrentIndex(0);
    setRevisedIds(new Set());
  }, []);

  const handleMarkRevised = useCallback(() => {
    if (!currentNote) return;
    setRevisedIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentNote.id)) {
        next.delete(currentNote.id);
      } else {
        next.add(currentNote.id);
      }
      return next;
    });
  }, [currentNote]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(sessionNotes.length - 1, i + 1));
  }, [sessionNotes.length]);

  const handleToggleFavorite = useCallback(() => {
    if (!currentNote) return;
    toggleFavorite(currentNote.id);
  }, [currentNote, toggleFavorite]);

  const handleToggleBookmark = useCallback(() => {
    if (!currentNote) return;
    toggleBookmark(currentNote.id);
  }, [currentNote, toggleBookmark]);

  if (step === 'summary') {
    const reviewedCount = sessionNotes.length;
    const revisedCount = revisedIds.size;

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Quick Revision" />
        <View style={styles.summaryContainer}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <View
              style={[
                styles.summaryIconContainer,
                { backgroundColor: theme.colors.successLight, borderRadius: theme.borderRadius.xl },
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={48}
                color={theme.colors.success}
              />
            </View>
            <Text
              style={[
                styles.summaryTitle,
                {
                  color: theme.colors.text,
                  fontSize: theme.fontSize.xxl,
                  fontWeight: theme.fontWeight.bold,
                },
              ]}
            >
              Session Complete
            </Text>
            <Text
              style={[
                styles.summarySubtitle,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
              ]}
            >
              Here's how you did
            </Text>

            <View style={styles.summaryStats}>
              <View style={[styles.summaryStat, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.md }]}>
                <Text
                  style={[
                    styles.summaryStatValue,
                    { color: theme.colors.primary, fontSize: theme.fontSize.xxxl, fontWeight: theme.fontWeight.bold },
                  ]}
                >
                  {reviewedCount}
                </Text>
                <Text
                  style={[
                    styles.summaryStatLabel,
                    { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
                  ]}
                >
                  Notes Reviewed
                </Text>
              </View>
              <View style={[styles.summaryStat, { backgroundColor: theme.colors.successLight, borderRadius: theme.borderRadius.md }]}>
                <Text
                  style={[
                    styles.summaryStatValue,
                    { color: theme.colors.success, fontSize: theme.fontSize.xxxl, fontWeight: theme.fontWeight.bold },
                  ]}
                >
                  {revisedCount}
                </Text>
                <Text
                  style={[
                    styles.summaryStatLabel,
                    { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
                  ]}
                >
                  Marked Revised
                </Text>
              </View>
            </View>
          </View>

          <Button
            title="Start New Session"
            onPress={handleNewSession}
            variant="primary"
            size="lg"
            icon="repeat"
            style={styles.newSessionButton}
          />
        </View>
      </View>
    );
  }

  if (step === 'reading') {
    const isRevised = currentNote ? revisedIds.has(currentNote.id) : false;

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Quick Revision" />

        <View style={styles.progressContainer}>
          <Text
            style={[
              styles.progressText,
              { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
            ]}
          >
            {currentIndex + 1} / {sessionNotes.length} notes
          </Text>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: theme.colors.borderLight, borderRadius: theme.borderRadius.full },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.full,
                  width: `${((currentIndex + 1) / sessionNotes.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {currentNote ? (
          <ScrollView style={styles.readingScroll} contentContainerStyle={styles.readingContent}>
            <View
              style={[
                styles.readingCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                  shadowColor: theme.colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                },
              ]}
            >
              {currentNote.subjectId && (
                <Text
                  style={[
                    styles.readingSubject,
                    { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
                  ]}
                >
                  {getSubjectName(currentNote.subjectId)}
                </Text>
              )}
              <Text
                style={[
                  styles.readingTitle,
                  {
                    color: theme.colors.text,
                    fontSize: theme.fontSize.xxl,
                    fontWeight: theme.fontWeight.bold,
                  },
                ]}
              >
                {currentNote.title}
              </Text>
              <View style={[styles.readingDivider, { backgroundColor: theme.colors.border }]} />
              <Text
                style={[
                  styles.readingBody,
                  {
                    color: theme.colors.text,
                    fontSize: theme.fontSize.md,
                    lineHeight: 26,
                  },
                ]}
              >
                {currentNote.content}
              </Text>
            </View>

            <View style={styles.readingActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isRevised ? theme.colors.successLight : theme.colors.surfaceVariant,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1.5,
                    borderColor: isRevised ? theme.colors.success : theme.colors.border,
                  },
                ]}
                onPress={handleMarkRevised}
                accessibilityLabel={isRevised ? 'Unmark as revised' : 'Mark as revised'}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name={isRevised ? 'check-circle' : 'check-circle-outline'}
                  size={20}
                  color={isRevised ? theme.colors.success : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    {
                      color: isRevised ? theme.colors.success : theme.colors.textSecondary,
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.semibold,
                    },
                  ]}
                >
                  {isRevised ? 'Revised' : 'Mark Revised'}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionButtonGroup}>
                <TouchableOpacity
                  style={[
                    styles.iconAction,
                    {
                      backgroundColor: currentNote.isFavorite ? theme.colors.errorLight : theme.colors.surfaceVariant,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={handleToggleFavorite}
                  accessibilityLabel={currentNote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name={currentNote.isFavorite ? 'heart' : 'heart-outline'}
                    size={20}
                    color={currentNote.isFavorite ? theme.colors.error : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.iconAction,
                    {
                      backgroundColor: currentNote.isBookmarked ? theme.colors.infoLight : theme.colors.surfaceVariant,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={handleToggleBookmark}
                  accessibilityLabel={currentNote.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name={currentNote.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={currentNote.isBookmarked ? theme.colors.info : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <EmptyState
            icon="book-open-variant"
            title="No Notes"
            subtitle="No notes match your selection"
          />
        )}

        <View
          style={[
            styles.navBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Button
            title="Previous"
            onPress={handlePrev}
            variant="outline"
            size="md"
            icon="chevron-left"
            disabled={currentIndex === 0}
            style={styles.navButton}
          />
          <Button
            title="End Session"
            onPress={handleEnd}
            variant="danger"
            size="md"
            icon="stop"
            style={styles.navButton}
          />
          <Button
            title="Next"
            onPress={handleNext}
            variant="outline"
            size="md"
            icon="chevron-right"
            disabled={currentIndex >= sessionNotes.length - 1}
            style={styles.navButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Quick Revision" />

      <ScrollView style={styles.selectScroll} contentContainerStyle={styles.selectContent}>
        <Text
          style={[
            styles.selectLabel,
            { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold },
          ]}
        >
          What would you like to revise?
        </Text>

        <View style={styles.chipRow}>
          <FilterChip
            label="All Notes"
            icon="note-text"
            selected={filterMode === 'all'}
            onPress={() => { setFilterMode('all'); setSelectedSubjectId(null); setSelectedTag(null); }}
          />
          <FilterChip
            label="Favorites"
            icon="heart"
            selected={filterMode === 'favorites'}
            onPress={() => { setFilterMode('favorites'); setSelectedSubjectId(null); setSelectedTag(null); }}
          />
          <FilterChip
            label="Important"
            icon="star"
            selected={filterMode === 'important'}
            onPress={() => { setFilterMode('important'); setSelectedSubjectId(null); setSelectedTag(null); }}
          />
          <FilterChip
            label="By Subject"
            icon="book-open-variant"
            selected={filterMode === 'subject'}
            onPress={() => { setFilterMode('subject'); setSelectedTag(null); }}
          />
          <FilterChip
            label="By Tags"
            icon="tag"
            selected={filterMode === 'tag'}
            onPress={() => { setFilterMode('tag'); setSelectedSubjectId(null); }}
          />
        </View>

        {filterMode === 'subject' && (
          <View style={styles.pickerSection}>
            <Text
              style={[
                styles.pickerLabel,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
              ]}
            >
              Select a subject
            </Text>
            {subjects.length === 0 ? (
              <Text style={[styles.noItems, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>
                No subjects found
              </Text>
            ) : (
              subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor: selectedSubjectId === subject.id ? theme.colors.primaryLight : theme.colors.surface,
                      borderColor: selectedSubjectId === subject.id ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() => setSelectedSubjectId(subject.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedSubjectId === subject.id }}
                  accessibilityLabel={subject.name}
                >
                  <MaterialCommunityIcons
                    name={subject.icon as any}
                    size={20}
                    color={selectedSubjectId === subject.id ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.pickerItemText,
                      {
                        color: selectedSubjectId === subject.id ? theme.colors.primary : theme.colors.text,
                        fontSize: theme.fontSize.md,
                        fontWeight: theme.fontWeight.medium,
                      },
                    ]}
                  >
                    {subject.name}
                  </Text>
                  {selectedSubjectId === subject.id && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {filterMode === 'tag' && (
          <View style={styles.pickerSection}>
            <Text
              style={[
                styles.pickerLabel,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
              ]}
            >
              Select a tag
            </Text>
            {availableTags.length === 0 ? (
              <Text style={[styles.noItems, { color: theme.colors.textMuted, fontSize: theme.fontSize.sm }]}>
                No tags found
              </Text>
            ) : (
              <View style={styles.tagChipRow}>
                {availableTags.map((tag) => (
                  <FilterChip
                    key={tag}
                    label={tag}
                    selected={selectedTag === tag}
                    onPress={() => setSelectedTag(tag)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.previewSection}>
          <Text
            style={[
              styles.previewCount,
              { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
            ]}
          >
            {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} will be included
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.startBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button
          title="Start Revision"
          onPress={handleStart}
          variant="primary"
          size="lg"
          icon="play"
          disabled={!canStart}
          style={styles.startButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectScroll: {
    flex: 1,
  },
  selectContent: {
    padding: 16,
  },
  selectLabel: {
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  pickerSection: {
    marginBottom: 16,
  },
  pickerLabel: {
    marginBottom: 10,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  pickerItemText: {
    flex: 1,
    marginLeft: 12,
  },
  noItems: {
    textAlign: 'center',
    paddingVertical: 16,
  },
  tagChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  previewCount: {},
  startBar: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  startButton: {
    width: '100%',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  readingScroll: {
    flex: 1,
  },
  readingContent: {
    padding: 16,
    paddingBottom: 24,
  },
  readingCard: {
    padding: 24,
  },
  readingSubject: {
    marginBottom: 8,
  },
  readingTitle: {
    marginBottom: 12,
  },
  readingDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  readingBody: {},
  readingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  actionButtonText: {},
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  iconAction: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  navButton: {
    flex: 1,
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  summaryCard: {
    width: '100%',
    padding: 32,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    marginBottom: 6,
  },
  summarySubtitle: {
    marginBottom: 28,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  summaryStatValue: {
    marginBottom: 4,
  },
  summaryStatLabel: {},
  newSessionButton: {
    width: '100%',
    marginTop: 28,
  },
});
