import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useFlashcardStore } from '@/store/useFlashcardStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import Header from '@/components/Header';
import FlashcardView from '@/components/FlashcardView';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import SectionHeader from '@/components/SectionHeader';
import type { Flashcard } from '@/types';

type ViewMode = 'list' | 'review';
type Difficulty = 'easy' | 'medium' | 'hard';

interface ModalState {
  visible: boolean;
  editId: string | null;
  question: string;
  answer: string;
  subjectId: string;
  difficulty: Difficulty;
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'hard', label: 'Hard', color: '#EF4444' },
];

function getDifficultyColor(diff: string, theme: any): string {
  switch (diff) {
    case 'easy':
      return theme.colors.success;
    case 'hard':
      return theme.colors.error;
    default:
      return theme.colors.warning;
  }
}

export default function FlashcardsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    flashcards,
    currentCardIndex,
    isFlipped,
    dueCards,
    loadFlashcards,
    loadFlashcardsBySubject,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    loadDueCards,
    reviewCard,
    flipCard,
    nextCard,
    previousCard,
  } = useFlashcardStore();
  const { subjects, loadSubjects } = useSubjectStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    visible: false,
    editId: null,
    question: '',
    answer: '',
    subjectId: '',
    difficulty: 'medium',
  });

  useEffect(() => {
    loadFlashcards();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (filterSubjectId) {
      loadFlashcardsBySubject(filterSubjectId);
    } else {
      loadFlashcards();
    }
  }, [filterSubjectId]);

  const displayedCards = useMemo(() => {
    if (viewMode === 'review') return dueCards;
    return flashcards;
  }, [viewMode, flashcards, dueCards]);

  const currentReviewCard = dueCards[currentCardIndex] || null;

  const handleOpenAdd = useCallback(() => {
    setModal({
      visible: true,
      editId: null,
      question: '',
      answer: '',
      subjectId: filterSubjectId || '',
      difficulty: 'medium',
    });
  }, [filterSubjectId]);

  const handleOpenEdit = useCallback((card: Flashcard) => {
    setModal({
      visible: true,
      editId: card.id,
      question: card.question,
      answer: card.answer,
      subjectId: card.subjectId || '',
      difficulty: card.difficulty,
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleSave = useCallback(() => {
    if (!modal.question.trim() || !modal.answer.trim()) return;
    if (modal.editId) {
      updateFlashcard(modal.editId, {
        question: modal.question.trim(),
        answer: modal.answer.trim(),
        difficulty: modal.difficulty,
      });
    } else {
      createFlashcard({
        question: modal.question.trim(),
        answer: modal.answer.trim(),
        subjectId: modal.subjectId || undefined,
        difficulty: modal.difficulty,
      });
    }
    handleCloseModal();
  }, [modal]);

  const handleDelete = useCallback((id: string) => {
    deleteFlashcard(id);
  }, []);

  const handleStartReview = useCallback(() => {
    loadDueCards();
    setViewMode('review');
  }, []);

  const handleEndReview = useCallback(() => {
    setViewMode('list');
    loadFlashcards();
  }, []);

  const handleRate = useCallback(
    (difficulty: Difficulty) => {
      if (!currentReviewCard) return;
      const now = new Date();
      let nextReviewMs: number;
      switch (difficulty) {
        case 'easy':
          nextReviewMs = now.getTime() + 7 * 24 * 60 * 60 * 1000;
          break;
        case 'medium':
          nextReviewMs = now.getTime() + 3 * 24 * 60 * 60 * 1000;
          break;
        case 'hard':
          nextReviewMs = now.getTime() + 1 * 24 * 60 * 60 * 1000;
          break;
      }
      reviewCard(currentReviewCard.id, new Date(nextReviewMs).toISOString());
    },
    [currentReviewCard]
  );

  const renderListItem = useCallback(
    ({ item }: { item: Flashcard }) => {
      const subject = subjects.find((s) => s.id === item.subjectId);
      return (
        <View
          style={[
            styles.listItem,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
            },
          ]}
          accessibilityLabel={`Flashcard: ${item.question}`}
        >
          <View style={styles.listItemContent}>
            <View style={styles.listItemHeader}>
              <View
                style={[
                  styles.difficultyBadge,
                  {
                    backgroundColor: getDifficultyColor(item.difficulty, theme) + '20',
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    {
                      color: getDifficultyColor(item.difficulty, theme),
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.semibold,
                    },
                  ]}
                >
                  {item.difficulty.toUpperCase()}
                </Text>
              </View>
              {subject && (
                <View
                  style={[
                    styles.subjectBadge,
                    {
                      backgroundColor: subject.color + '20',
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.subjectBadgeText,
                      {
                        color: subject.color,
                        fontSize: theme.fontSize.xs,
                      },
                    ]}
                  >
                    {subject.name}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.questionText,
                {
                  color: theme.colors.text,
                  fontSize: theme.fontSize.md,
                  fontWeight: theme.fontWeight.medium,
                },
              ]}
              numberOfLines={2}
            >
              {item.question}
            </Text>
            <Text
              style={[
                styles.answerPreview,
                {
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.sm,
                },
              ]}
              numberOfLines={1}
            >
              {item.answer}
            </Text>
          </View>
          <View style={styles.listItemActions}>
            <TouchableOpacity
              onPress={() => handleOpenEdit(item)}
              style={[styles.actionButton, { borderRadius: theme.borderRadius.sm }]}
              accessibilityLabel="Edit flashcard"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="pencil"
                size={18}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={[styles.actionButton, { borderRadius: theme.borderRadius.sm }]}
              accessibilityLabel="Delete flashcard"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="delete-outline"
                size={18}
                color={theme.colors.error}
              />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [subjects, theme, handleOpenEdit, handleDelete]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Flashcards"
        showBack
        onBack={() => router.back()}
      />

      {viewMode === 'list' ? (
        <>
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={() => setShowFilterPicker(!showFilterPicker)}
              accessibilityLabel={`Filter by subject: ${filterSubjectId ? subjects.find((s) => s.id === filterSubjectId)?.name : 'All'}`}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="filter-variant"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterText,
                  {
                    color: theme.colors.text,
                    fontSize: theme.fontSize.sm,
                  },
                ]}
              >
                {filterSubjectId
                  ? subjects.find((s) => s.id === filterSubjectId)?.name || 'Filter'
                  : 'All Subjects'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>

            <Button
              title="Review"
              onPress={handleStartReview}
              variant="primary"
              size="sm"
              icon="play-circle-outline"
              disabled={flashcards.length === 0}
            />
          </View>

          {showFilterPicker && (
            <View
              style={[
                styles.filterPicker,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                  marginHorizontal: 16,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.filterOption, { borderBottomColor: theme.colors.borderLight }]}
                onPress={() => {
                  setFilterSubjectId(null);
                  setShowFilterPicker(false);
                }}
                accessibilityLabel="Show all subjects"
                accessibilityRole="radio"
                accessibilityState={{ checked: !filterSubjectId }}
              >
                <Text
                  style={{
                    color: !filterSubjectId ? theme.colors.primary : theme.colors.text,
                    fontSize: theme.fontSize.md,
                    fontWeight: !filterSubjectId ? theme.fontWeight.semibold : theme.fontWeight.normal,
                  }}
                >
                  All Subjects
                </Text>
                {!filterSubjectId && (
                  <MaterialCommunityIcons name="check" size={18} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[styles.filterOption, { borderBottomColor: theme.colors.borderLight }]}
                  onPress={() => {
                    setFilterSubjectId(subject.id);
                    setShowFilterPicker(false);
                  }}
                  accessibilityLabel={subject.name}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: filterSubjectId === subject.id }}
                >
                  <View style={styles.filterOptionLeft}>
                    <View
                      style={[
                        styles.filterDot,
                        { backgroundColor: subject.color, borderRadius: theme.borderRadius.full },
                      ]}
                    />
                    <Text
                      style={{
                        color: filterSubjectId === subject.id ? theme.colors.primary : theme.colors.text,
                        fontSize: theme.fontSize.md,
                        fontWeight: filterSubjectId === subject.id ? theme.fontWeight.semibold : theme.fontWeight.normal,
                      }}
                    >
                      {subject.name}
                    </Text>
                  </View>
                  {filterSubjectId === subject.id && (
                    <MaterialCommunityIcons name="check" size={18} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {flashcards.length === 0 ? (
            <EmptyState
              icon="cards-outline"
              title="No flashcards yet"
              subtitle="Create your first flashcard to start reviewing"
              actionTitle="Add Flashcard"
              onAction={handleOpenAdd}
            />
          ) : (
            <FlatList
              data={displayedCards}
              keyExtractor={(item) => item.id}
              renderItem={renderListItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.full,
              },
            ]}
            onPress={handleOpenAdd}
            accessibilityLabel="Add new flashcard"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      ) : (
        <ScrollView
          contentContainerStyle={styles.reviewContainer}
          showsVerticalScrollIndicator={false}
        >
          {currentReviewCard ? (
            <>
              <View style={styles.reviewProgress}>
                <Text
                  style={[
                    styles.reviewProgressText,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSize.sm,
                    },
                  ]}
                >
                  {currentCardIndex + 1} of {dueCards.length}
                </Text>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.full },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((currentCardIndex + 1) / dueCards.length) * 100}%`,
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.borderRadius.full,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.flashcardContainer}>
                <FlashcardView
                  question={currentReviewCard.question}
                  answer={currentReviewCard.answer}
                  isFlipped={isFlipped}
                  onFlip={flipCard}
                />
              </View>

              <View style={styles.ratingRow}>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.ratingButton,
                      {
                        backgroundColor: opt.color + '15',
                        borderColor: opt.color,
                        borderRadius: theme.borderRadius.md,
                      },
                    ]}
                    onPress={() => handleRate(opt.value)}
                    accessibilityLabel={`Rate as ${opt.label}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.ratingText,
                        {
                          color: opt.color,
                          fontSize: theme.fontSize.sm,
                          fontWeight: theme.fontWeight.semibold,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.navigationRow}>
                <Button
                  title="Previous"
                  onPress={previousCard}
                  variant="outline"
                  size="sm"
                  icon="chevron-left"
                  disabled={currentCardIndex === 0}
                />
                <Button
                  title="End Review"
                  onPress={handleEndReview}
                  variant="ghost"
                  size="sm"
                />
                <Button
                  title="Next"
                  onPress={nextCard}
                  variant="outline"
                  size="sm"
                  icon="chevron-right"
                  disabled={currentCardIndex >= dueCards.length - 1}
                />
              </View>
            </>
          ) : (
            <EmptyState
              icon="check-circle-outline"
              title="All caught up!"
              subtitle="No cards due for review right now"
              actionTitle="Back to List"
              onAction={handleEndReview}
            />
          )}
        </ScrollView>
      )}

      <Modal
        visible={modal.visible}
        onClose={handleCloseModal}
        title={modal.editId ? 'Edit Flashcard' : 'New Flashcard'}
      >
        <Input
          label="Question"
          value={modal.question}
          onChangeText={(t) => setModal((prev) => ({ ...prev, question: t }))}
          placeholder="Enter your question"
          multiline
        />
        <Input
          label="Answer"
          value={modal.answer}
          onChangeText={(t) => setModal((prev) => ({ ...prev, answer: t }))}
          placeholder="Enter the answer"
          multiline
          style={{ marginTop: 8 }}
        />

        <Text
          style={[
            styles.modalLabel,
            {
              color: theme.colors.text,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
            },
          ]}
        >
          Subject
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: !modal.subjectId ? theme.colors.primary : theme.colors.surfaceVariant,
                borderColor: !modal.subjectId ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.borderRadius.full,
              },
            ]}
            onPress={() => setModal((prev) => ({ ...prev, subjectId: '' }))}
            accessibilityLabel="No subject"
            accessibilityRole="radio"
            accessibilityState={{ checked: !modal.subjectId }}
          >
            <Text
              style={{
                color: !modal.subjectId ? '#FFFFFF' : theme.colors.text,
                fontSize: theme.fontSize.sm,
              }}
            >
              None
            </Text>
          </TouchableOpacity>
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.chip,
                {
                  backgroundColor: modal.subjectId === subject.id ? subject.color : theme.colors.surfaceVariant,
                  borderColor: modal.subjectId === subject.id ? subject.color : theme.colors.border,
                  borderRadius: theme.borderRadius.full,
                },
              ]}
              onPress={() => setModal((prev) => ({ ...prev, subjectId: subject.id }))}
              accessibilityLabel={subject.name}
              accessibilityRole="radio"
              accessibilityState={{ checked: modal.subjectId === subject.id }}
            >
              <Text
                style={{
                  color: modal.subjectId === subject.id ? '#FFFFFF' : theme.colors.text,
                  fontSize: theme.fontSize.sm,
                }}
              >
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text
          style={[
            styles.modalLabel,
            {
              color: theme.colors.text,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              marginTop: 12,
            },
          ]}
        >
          Difficulty
        </Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.difficultyChip,
                {
                  backgroundColor: modal.difficulty === opt.value ? opt.color : theme.colors.surfaceVariant,
                  borderColor: modal.difficulty === opt.value ? opt.color : theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={() => setModal((prev) => ({ ...prev, difficulty: opt.value }))}
              accessibilityLabel={`Difficulty: ${opt.label}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: modal.difficulty === opt.value }}
            >
              <Text
                style={{
                  color: modal.difficulty === opt.value ? '#FFFFFF' : theme.colors.text,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.semibold,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={modal.editId ? 'Update' : 'Save'}
          onPress={handleSave}
          disabled={!modal.question.trim() || !modal.answer.trim()}
          style={{ marginTop: 16 }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
    flex: 1,
  },
  filterText: {
    flex: 1,
  },
  filterPicker: {
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterDot: {
    width: 10,
    height: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  difficultyText: {
    letterSpacing: 0.5,
  },
  subjectBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  subjectBadgeText: {},
  questionText: {
    marginBottom: 4,
  },
  answerPreview: {},
  listItemActions: {
    justifyContent: 'center',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  reviewContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  reviewProgress: {
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  reviewProgressText: {},
  progressBar: {
    width: '100%',
    height: 4,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  flashcardContainer: {
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  ratingText: {},
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalLabel: {
    marginBottom: 6,
  },
  chipScroll: {
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
});
