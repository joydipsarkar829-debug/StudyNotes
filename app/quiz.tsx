import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useQuizStore } from '@/store/useQuizStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import Header from '@/components/Header';
import Button from '@/components/Button';
import Input from '@/components/Input';
import EmptyState from '@/components/EmptyState';
import SectionHeader from '@/components/SectionHeader';
import QuizOption from '@/components/QuizOption';
import ProgressBar from '@/components/ProgressBar';
import type { Quiz, QuizQuestion } from '@/types';

type ViewMode = 'list' | 'create' | 'taking' | 'result';
type QuestionType = 'mcq' | 'true_false' | 'fill_blank';

interface QuestionDraft {
  question: string;
  options: string[];
  correctAnswer: string;
  type: QuestionType;
  explanation: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function QuizScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    quizzes,
    currentQuiz,
    currentQuestionIndex,
    answers,
    quizHistory,
    loadQuizzes,
    loadQuizHistory,
    createQuiz,
    deleteQuiz,
    startQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    completeQuiz,
    resetQuiz,
    addQuizQuestion,
    getQuizQuestions,
  } = useQuizStore();
  const { subjects, loadSubjects } = useSubjectStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '0',
    type: 'mcq',
    explanation: '',
  });
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  const [createdQuestions, setCreatedQuestions] = useState<QuizQuestion[]>([]);
  const [submittedAnswer, setSubmittedAnswer] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<Quiz | null>(null);

  useEffect(() => {
    loadQuizzes();
    loadQuizHistory();
    loadSubjects();
  }, []);

  const pendingQuizzes = useMemo(
    () => quizzes.filter((q) => !q.completedAt),
    [quizzes]
  );

  const handleCreateQuiz = useCallback(() => {
    if (!quizTitle.trim()) return;
    const quiz = createQuiz({
      title: quizTitle.trim(),
      subjectId: selectedSubjectId || undefined,
      type: 'mixed',
    });
    if (quiz) {
      setCreatedQuizId(quiz.id);
      setCreatedQuestions([]);
      setQuizTitle('');
      setSelectedSubjectId('');
      setQuestionDraft({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '0',
        type: 'mcq',
        explanation: '',
      });
      setViewMode('create');
    }
  }, [quizTitle, selectedSubjectId]);

  const handleAddQuestion = useCallback(() => {
    if (!questionDraft.question.trim() || !createdQuizId) return;

    if (questionDraft.type === 'mcq') {
      const filledOptions = questionDraft.options.filter((o) => o.trim());
      if (filledOptions.length < 2) return;
    }

    const correctIdx = parseInt(questionDraft.correctAnswer, 10);
    const typeMap: Record<QuestionType, 'mcq' | 'true_false' | 'fill_blank'> = {
      mcq: 'mcq',
      true_false: 'true_false',
      fill_blank: 'fill_blank',
    };

    let options: string[] | undefined;
    if (questionDraft.type === 'mcq') {
      options = questionDraft.options.filter((o) => o.trim());
    } else if (questionDraft.type === 'true_false') {
      options = ['True', 'False'];
    }

    const q = addQuizQuestion({
      quizId: createdQuizId,
      question: questionDraft.question.trim(),
      options,
      correctAnswer: String(correctIdx),
      type: typeMap[questionDraft.type],
      explanation: questionDraft.explanation.trim() || undefined,
    });

    if (q) {
      setCreatedQuestions((prev) => [...prev, q]);
      setQuestionDraft({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '0',
        type: 'mcq',
        explanation: '',
      });
    }
  }, [questionDraft, createdQuizId]);

  const handleStartCreatedQuiz = useCallback(() => {
    if (!createdQuizId || createdQuestions.length < 3) return;
    const quiz = startQuiz(createdQuizId);
    if (quiz) {
      setViewMode('taking');
      setSubmittedAnswer(false);
    }
  }, [createdQuizId, createdQuestions.length]);

  const handleStartExistingQuiz = useCallback((quizId: string) => {
    const quiz = startQuiz(quizId);
    if (quiz) {
      setViewMode('taking');
      setSubmittedAnswer(false);
    }
  }, []);

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuiz) return;
    const q = currentQuiz.questions[currentQuestionIndex];
    const selected = answers[q.id];
    if (selected === undefined) return;
    setSubmittedAnswer(true);
  }, [currentQuiz, currentQuestionIndex, answers]);

  const handleNextQuestion = useCallback(() => {
    if (!currentQuiz) return;
    if (currentQuestionIndex >= currentQuiz.questions.length - 1) {
      const result = completeQuiz();
      if (result) {
        setQuizResult(result);
        setViewMode('result');
      }
    } else {
      nextQuestion();
      setSubmittedAnswer(false);
    }
  }, [currentQuiz, currentQuestionIndex]);

  const handleTryAgain = useCallback(() => {
    if (quizResult) {
      const quiz = startQuiz(quizResult.id);
      if (quiz) {
        setQuizResult(null);
        setViewMode('taking');
        setSubmittedAnswer(false);
      }
    }
  }, [quizResult]);

  const handleBackToList = useCallback(() => {
    resetQuiz();
    setQuizResult(null);
    setCreatedQuizId(null);
    setCreatedQuestions([]);
    setViewMode('list');
    loadQuizzes();
    loadQuizHistory();
  }, []);

  const currentQuestion = currentQuiz?.questions[currentQuestionIndex] || null;

  const renderQuizListItem = useCallback(
    ({ item }: { item: Quiz }) => {
      const subject = subjects.find((s) => s.id === item.subjectId);
      const isCompleted = !!item.completedAt;
      const scorePercent =
        isCompleted && item.totalQuestions > 0
          ? Math.round(((item.score ?? 0) / item.totalQuestions) * 100)
          : 0;

      return (
        <TouchableOpacity
          style={[
            styles.quizCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderLeftColor: subject?.color || theme.colors.primary,
            },
          ]}
          onPress={() => (isCompleted ? null : handleStartExistingQuiz(item.id))}
          disabled={isCompleted}
          accessibilityLabel={`Quiz: ${item.title}, ${item.totalQuestions} questions${isCompleted ? `, Score: ${item.score}/${item.totalQuestions}` : ''}`}
          accessibilityRole="button"
        >
          <View style={styles.quizCardContent}>
            <View style={styles.quizCardHeader}>
              <Text
                style={[
                  styles.quizCardTitle,
                  {
                    color: theme.colors.text,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {isCompleted ? (
                <View
                  style={[
                    styles.scoreBadge,
                    {
                      backgroundColor:
                        scorePercent >= 70
                          ? theme.colors.successLight
                          : scorePercent >= 40
                          ? theme.colors.warningLight
                          : theme.colors.errorLight,
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreBadgeText,
                      {
                        color:
                          scorePercent >= 70
                            ? theme.colors.success
                            : scorePercent >= 40
                            ? theme.colors.warning
                            : theme.colors.error,
                        fontSize: theme.fontSize.xs,
                        fontWeight: theme.fontWeight.semibold,
                      },
                    ]}
                  >
                    {scorePercent}%
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.pendingBadge,
                    {
                      backgroundColor: theme.colors.infoLight,
                      borderRadius: theme.borderRadius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pendingBadgeText,
                      {
                        color: theme.colors.info,
                        fontSize: theme.fontSize.xs,
                        fontWeight: theme.fontWeight.semibold,
                      },
                    ]}
                  >
                    {item.totalQuestions}Q
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.quizCardMeta}>
              {subject && (
                <View style={styles.quizMetaItem}>
                  <View
                    style={[
                      styles.quizMetaDot,
                      { backgroundColor: subject.color, borderRadius: theme.borderRadius.full },
                    ]}
                  />
                  <Text
                    style={[
                      styles.quizMetaText,
                      { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },
                    ]}
                  >
                    {subject.name}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.quizMetaText,
                  { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
                ]}
              >
                {formatDate(isCompleted ? item.completedAt! : item.createdAt)}
              </Text>
            </View>
          </View>
          {!isCompleted && (
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={24}
              color={theme.colors.primary}
            />
          )}
        </TouchableOpacity>
      );
    },
    [subjects, theme, handleStartExistingQuiz]
  );

  const renderHistoryItem = useCallback(
    ({ item }: { item: Quiz }) => {
      const subject = subjects.find((s) => s.id === item.subjectId);
      const scorePercent =
        item.totalQuestions > 0
          ? Math.round(((item.score ?? 0) / item.totalQuestions) * 100)
          : 0;

      return (
        <View
          style={[
            styles.historyItem,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
            },
          ]}
          accessibilityLabel={`Completed quiz: ${item.title}, Score: ${item.score}/${item.totalQuestions}`}
        >
          <View style={styles.historyItemContent}>
            <Text
              style={[
                styles.historyItemTitle,
                { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.historyItemMeta,
                { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
              ]}
            >
              {item.score}/{item.totalQuestions} correct
            </Text>
          </View>
          <Text
            style={[
              styles.historyItemScore,
              {
                color:
                  scorePercent >= 70
                    ? theme.colors.success
                    : scorePercent >= 40
                    ? theme.colors.warning
                    : theme.colors.error,
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.bold,
              },
            ]}
          >
            {scorePercent}%
          </Text>
        </View>
      );
    },
    [subjects, theme]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={viewMode === 'create' ? 'Create Quiz' : viewMode === 'taking' ? 'Quiz' : viewMode === 'result' ? 'Quiz Result' : 'Quiz Mode'}
        showBack
        onBack={() => {
          if (viewMode === 'list') router.back();
          else handleBackToList();
        }}
      />

      {viewMode === 'list' && (
        <>
          {quizzes.length === 0 ? (
            <EmptyState
              icon="frequently-asked-questions"
              title="No quizzes yet"
              subtitle="Create your first quiz to test your knowledge"
              actionTitle="Create Quiz"
              onAction={handleCreateQuiz}
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {pendingQuizzes.length > 0 && (
                <>
                  <SectionHeader title="Pending Quizzes" />
                  <View style={styles.sectionList}>
                    {pendingQuizzes.map((quiz) => (
                      <React.Fragment key={quiz.id}>{renderQuizListItem({ item: quiz })}</React.Fragment>
                    ))}
                  </View>
                </>
              )}

              {quizHistory.length > 0 && (
                <>
                  <SectionHeader title="Quiz History" />
                  <View style={styles.sectionList}>
                    {quizHistory.slice(0, 20).map((quiz) => (
                      <React.Fragment key={quiz.id}>{renderHistoryItem({ item: quiz })}</React.Fragment>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.full,
              },
            ]}
            onPress={handleCreateQuiz}
            accessibilityLabel="Create new quiz"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}

      {viewMode === 'create' && (
        <ScrollView
          contentContainerStyle={styles.createContent}
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Quiz Title"
            value={quizTitle}
            onChangeText={setQuizTitle}
            placeholder="Enter quiz title"
            leftIcon="format-title"
          />

          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
            ]}
          >
            Subject (Optional)
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
                  backgroundColor: !selectedSubjectId ? theme.colors.primary : theme.colors.surfaceVariant,
                  borderColor: !selectedSubjectId ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.borderRadius.full,
                },
              ]}
              onPress={() => setSelectedSubjectId('')}
              accessibilityLabel="No subject"
              accessibilityRole="radio"
              accessibilityState={{ checked: !selectedSubjectId }}
            >
              <Text
                style={{
                  color: !selectedSubjectId ? '#FFFFFF' : theme.colors.text,
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
                    backgroundColor: selectedSubjectId === subject.id ? subject.color : theme.colors.surfaceVariant,
                    borderColor: selectedSubjectId === subject.id ? subject.color : theme.colors.border,
                    borderRadius: theme.borderRadius.full,
                  },
                ]}
                onPress={() => setSelectedSubjectId(subject.id)}
                accessibilityLabel={subject.name}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedSubjectId === subject.id }}
              >
                <Text
                  style={{
                    color: selectedSubjectId === subject.id ? '#FFFFFF' : theme.colors.text,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {createdQuizId && (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border, marginTop: theme.spacing.lg },
                ]}
              />

              <SectionHeader
                title={`Questions (${createdQuestions.length})`}
                actionTitle="Start Quiz"
                onAction={createdQuestions.length >= 3 ? handleStartCreatedQuiz : undefined}
              />

              {createdQuestions.length < 3 && (
                <Text
                  style={[
                    styles.hint,
                    {
                      color: theme.colors.textMuted,
                      fontSize: theme.fontSize.xs,
                      marginHorizontal: 16,
                      marginBottom: 8,
                    },
                  ]}
                >
                  Add at least 3 questions to start the quiz
                </Text>
              )}

              <View style={styles.questionForm}>
                <Input
                  label="Question"
                  value={questionDraft.question}
                  onChangeText={(t) => setQuestionDraft((p) => ({ ...p, question: t }))}
                  placeholder="Enter your question"
                  multiline
                />

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, marginTop: 12 },
                  ]}
                >
                  Question Type
                </Text>
                <View style={styles.typeRow}>
                  {([
                    { value: 'mcq' as QuestionType, label: 'Multiple Choice', icon: 'format-list-bulleted' },
                    { value: 'true_false' as QuestionType, label: 'True / False', icon: 'check-all' },
                    { value: 'fill_blank' as QuestionType, label: 'Short Answer', icon: 'pencil-outline' },
                  ]).map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: questionDraft.type === opt.value ? theme.colors.primary : theme.colors.surfaceVariant,
                          borderColor: questionDraft.type === opt.value ? theme.colors.primary : theme.colors.border,
                          borderRadius: theme.borderRadius.md,
                        },
                      ]}
                      onPress={() => setQuestionDraft((p) => ({ ...p, type: opt.value, correctAnswer: '0' }))}
                      accessibilityLabel={opt.label}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: questionDraft.type === opt.value }}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon as any}
                        size={14}
                        color={questionDraft.type === opt.value ? '#FFFFFF' : theme.colors.textSecondary}
                      />
                      <Text
                        style={{
                          color: questionDraft.type === opt.value ? '#FFFFFF' : theme.colors.text,
                          fontSize: theme.fontSize.xs,
                          fontWeight: theme.fontWeight.medium,
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {questionDraft.type === 'mcq' && (
                  <View style={styles.optionsContainer}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, marginTop: 12 },
                      ]}
                    >
                      Options & Correct Answer
                    </Text>
                    {questionDraft.options.map((opt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.optionRow,
                          {
                            backgroundColor: parseInt(questionDraft.correctAnswer) === idx ? theme.colors.successLight : theme.colors.surface,
                            borderColor: parseInt(questionDraft.correctAnswer) === idx ? theme.colors.success : theme.colors.border,
                            borderRadius: theme.borderRadius.md,
                          },
                        ]}
                        onPress={() => setQuestionDraft((p) => ({ ...p, correctAnswer: String(idx) }))}
                        accessibilityLabel={`Option ${idx + 1}${parseInt(questionDraft.correctAnswer) === idx ? ', correct answer' : ''}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: parseInt(questionDraft.correctAnswer) === idx }}
                      >
                        <MaterialCommunityIcons
                          name={parseInt(questionDraft.correctAnswer) === idx ? 'check-circle' : 'circle-outline'}
                          size={20}
                          color={parseInt(questionDraft.correctAnswer) === idx ? theme.colors.success : theme.colors.textMuted}
                        />
                        <TextInput
                          style={[
                            styles.optionInput,
                            {
                              color: theme.colors.text,
                              fontSize: theme.fontSize.sm,
                              borderColor: 'transparent',
                              backgroundColor: 'transparent',
                            },
                          ]}
                          value={opt}
                          onChangeText={(t) => {
                            setQuestionDraft((p) => {
                              const newOpts = [...p.options];
                              newOpts[idx] = t;
                              return { ...p, options: newOpts };
                            });
                          }}
                          placeholder={`Option ${idx + 1}`}
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {questionDraft.type === 'true_false' && (
                  <View style={styles.tfContainer}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, marginTop: 12 },
                      ]}
                    >
                      Correct Answer
                    </Text>
                    <View style={styles.tfRow}>
                      {['True', 'False'].map((label, idx) => (
                        <TouchableOpacity
                          key={label}
                          style={[
                            styles.tfButton,
                            {
                              backgroundColor: parseInt(questionDraft.correctAnswer) === idx ? theme.colors.success : theme.colors.surfaceVariant,
                              borderColor: parseInt(questionDraft.correctAnswer) === idx ? theme.colors.success : theme.colors.border,
                              borderRadius: theme.borderRadius.md,
                            },
                          ]}
                          onPress={() => setQuestionDraft((p) => ({ ...p, correctAnswer: String(idx) }))}
                          accessibilityLabel={`Correct answer: ${label}`}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: parseInt(questionDraft.correctAnswer) === idx }}
                        >
                          <MaterialCommunityIcons
                            name={parseInt(questionDraft.correctAnswer) === idx ? 'check-circle' : 'circle-outline'}
                            size={20}
                            color={parseInt(questionDraft.correctAnswer) === idx ? '#FFFFFF' : theme.colors.textSecondary}
                          />
                          <Text
                            style={{
                              color: parseInt(questionDraft.correctAnswer) === idx ? '#FFFFFF' : theme.colors.text,
                              fontSize: theme.fontSize.md,
                              fontWeight: theme.fontWeight.semibold,
                            }}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {questionDraft.type === 'fill_blank' && (
                  <Input
                    label="Correct Answer"
                    value={questionDraft.options[0] || ''}
                    onChangeText={(t) => {
                      setQuestionDraft((p) => {
                        const newOpts = [t];
                        return { ...p, options: newOpts };
                      });
                    }}
                    placeholder="Enter the correct answer"
                    style={{ marginTop: 12 }}
                  />
                )}

                <Input
                  label="Explanation (Optional)"
                  value={questionDraft.explanation}
                  onChangeText={(t) => setQuestionDraft((p) => ({ ...p, explanation: t }))}
                  placeholder="Why is this the correct answer?"
                  multiline
                  style={{ marginTop: 8 }}
                />

                <Button
                  title="Add Question"
                  onPress={handleAddQuestion}
                  disabled={!questionDraft.question.trim()}
                  icon="plus"
                  variant="outline"
                  style={{ marginTop: 12 }}
                />
              </View>
            </>
          )}

          {!createdQuizId && (
            <Button
              title="Create Quiz"
              onPress={handleCreateQuiz}
              disabled={!quizTitle.trim()}
              icon="check"
              style={{ marginTop: 16 }}
            />
          )}
        </ScrollView>
      )}

      {viewMode === 'taking' && currentQuiz && currentQuestion && (
        <ScrollView
          contentContainerStyle={styles.takingContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressSection}>
            <ProgressBar
              progress={((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}
            />
            <Text
              style={[
                styles.progressLabel,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginTop: 8 },
              ]}
            >
              Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
            </Text>
          </View>

          <Text
            style={[
              styles.questionText,
              {
                color: theme.colors.text,
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.semibold,
              },
            ]}
          >
            {currentQuestion.question}
          </Text>

          {currentQuestion.type === 'mcq' && currentQuestion.options.map((opt, idx) => (
            <QuizOption
              key={idx}
              text={opt}
              selected={answers[currentQuestion.id] === String(idx)}
              correct={submittedAnswer && parseInt(currentQuestion.correctAnswer) === idx}
              incorrect={submittedAnswer && answers[currentQuestion.id] === String(idx) && parseInt(currentQuestion.correctAnswer) !== idx}
              onPress={() => !submittedAnswer && answerQuestion(currentQuestion.id, String(idx))}
              disabled={submittedAnswer}
            />
          ))}

          {currentQuestion.type === 'true_false' && ['True', 'False'].map((label, idx) => (
            <QuizOption
              key={label}
              text={label}
              selected={answers[currentQuestion.id] === String(idx)}
              correct={submittedAnswer && parseInt(currentQuestion.correctAnswer) === idx}
              incorrect={submittedAnswer && answers[currentQuestion.id] === String(idx) && parseInt(currentQuestion.correctAnswer) !== idx}
              onPress={() => !submittedAnswer && answerQuestion(currentQuestion.id, String(idx))}
              disabled={submittedAnswer}
            />
          ))}

          {currentQuestion.type === 'fill_blank' && !submittedAnswer && (
            <Input
              label="Your Answer"
              value={answers[currentQuestion.id] || ''}
              onChangeText={(t) => answerQuestion(currentQuestion.id, t)}
              placeholder="Type your answer"
              leftIcon="pencil-outline"
            />
          )}

          {submittedAnswer && currentQuestion.type === 'fill_blank' && (
            <View
              style={[
                styles.fillBlankResult,
                {
                  backgroundColor: (answers[currentQuestion.id] || '').toLowerCase().trim() ===
                    (currentQuestion.options[parseInt(currentQuestion.correctAnswer)] || '').toLowerCase().trim()
                    ? theme.colors.successLight
                    : theme.colors.errorLight,
                  borderRadius: theme.borderRadius.md,
                  borderColor:
                    (answers[currentQuestion.id] || '').toLowerCase().trim() ===
                    (currentQuestion.options[parseInt(currentQuestion.correctAnswer)] || '').toLowerCase().trim()
                    ? theme.colors.success
                    : theme.colors.error,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  (answers[currentQuestion.id] || '').toLowerCase().trim() ===
                  (currentQuestion.options[parseInt(currentQuestion.correctAnswer)] || '').toLowerCase().trim()
                    ? 'check-circle'
                    : 'close-circle'
                }
                size={24}
                color={
                  (answers[currentQuestion.id] || '').toLowerCase().trim() ===
                  (currentQuestion.options[parseInt(currentQuestion.correctAnswer)] || '').toLowerCase().trim()
                    ? theme.colors.success
                    : theme.colors.error
                }
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.medium,
                  }}
                >
                  Your answer: {answers[currentQuestion.id] || '(empty)'}
                </Text>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSize.sm,
                    marginTop: 4,
                  }}
                >
                  Correct: {currentQuestion.options[parseInt(currentQuestion.correctAnswer)]}
                </Text>
              </View>
            </View>
          )}

          {submittedAnswer && currentQuestion.explanation && (
            <View
              style={[
                styles.explanationBox,
                {
                  backgroundColor: theme.colors.infoLight,
                  borderRadius: theme.borderRadius.md,
                  borderLeftColor: theme.colors.info,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={theme.colors.info}
              />
              <Text
                style={[
                  styles.explanationText,
                  { color: theme.colors.text, fontSize: theme.fontSize.sm },
                ]}
              >
                {currentQuestion.explanation}
              </Text>
            </View>
          )}

          <View style={styles.takingActions}>
            {!submittedAnswer ? (
              <Button
                title="Submit Answer"
                onPress={handleSubmitAnswer}
                disabled={answers[currentQuestion.id] === undefined}
                icon="check"
                style={{ flex: 1 }}
              />
            ) : (
              <Button
                title={
                  currentQuestionIndex >= currentQuiz.questions.length - 1
                    ? 'See Results'
                    : 'Next Question'
                }
                onPress={handleNextQuestion}
                icon={
                  currentQuestionIndex >= currentQuiz.questions.length - 1
                    ? 'flag-checkered'
                    : 'chevron-right'
                }
                style={{ flex: 1 }}
              />
            )}
          </View>
        </ScrollView>
      )}

      {viewMode === 'result' && quizResult && (
        <ScrollView
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="trophy"
              size={48}
              color={
                (quizResult.score ?? 0) / Math.max(quizResult.totalQuestions, 1) >= 0.7
                  ? theme.colors.success
                  : theme.colors.warning
              }
            />
            <Text
              style={[
                styles.resultScore,
                {
                  color: theme.colors.text,
                  fontSize: theme.fontSize.xxxl,
                  fontWeight: theme.fontWeight.bold,
                },
              ]}
            >
              {quizResult.score ?? 0}/{quizResult.totalQuestions}
            </Text>
            <Text
              style={[
                styles.resultPercentage,
                {
                  color:
                    (quizResult.score ?? 0) / Math.max(quizResult.totalQuestions, 1) >= 0.7
                      ? theme.colors.success
                      : (quizResult.score ?? 0) / Math.max(quizResult.totalQuestions, 1) >= 0.4
                      ? theme.colors.warning
                      : theme.colors.error,
                  fontSize: theme.fontSize.xl,
                  fontWeight: theme.fontWeight.semibold,
                },
              ]}
            >
              {Math.round(((quizResult.score ?? 0) / Math.max(quizResult.totalQuestions, 1)) * 100)}%
            </Text>
            <Text
              style={[
                styles.resultMessage,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSize.md,
                },
              ]}
            >
              {(quizResult.score ?? 0) / Math.max(quizResult.totalQuestions, 1) >= 0.7
                ? 'Great job! Keep up the good work!'
                : (quizResult.score ?? 0) / Math.max(quizResult.totalQuestions, 1) >= 0.4
                ? 'Good effort! Review the topics you missed.'
                : 'Keep studying! You will improve.'}
            </Text>
          </View>

          <SectionHeader title="Question Review" />
          {quizResult.questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer !== undefined && parseInt(userAnswer) === q.correctAnswer;
            return (
              <View
                key={q.id}
                style={[
                  styles.reviewItem,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    borderLeftColor: isCorrect ? theme.colors.success : theme.colors.error,
                  },
                ]}
                accessibilityLabel={`Question ${idx + 1}: ${isCorrect ? 'correct' : 'incorrect'}`}
              >
                <View style={styles.reviewItemHeader}>
                  <MaterialCommunityIcons
                    name={isCorrect ? 'check-circle' : 'close-circle'}
                    size={20}
                    color={isCorrect ? theme.colors.success : theme.colors.error}
                  />
                  <Text
                    style={[
                      styles.reviewQuestion,
                      {
                        color: theme.colors.text,
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.fontWeight.medium,
                        flex: 1,
                      },
                    ]}
                    numberOfLines={3}
                  >
                    {q.question}
                  </Text>
                </View>
                {!isCorrect && (
                  <View style={styles.reviewAnswerRow}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>
                      Your answer: {userAnswer !== undefined ? q.options[parseInt(userAnswer)] || userAnswer : '(skipped)'}
                    </Text>
                    <Text style={{ color: theme.colors.success, fontSize: theme.fontSize.xs }}>
                      Correct: {q.options[q.correctAnswer] || q.correctAnswer}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.resultActions}>
            <Button
              title="Try Again"
              onPress={handleTryAgain}
              variant="outline"
              icon="restart"
              style={{ flex: 1 }}
            />
            <Button
              title="Back to Quizzes"
              onPress={handleBackToList}
              icon="format-list-bulleted"
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
  },
  sectionList: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderLeftWidth: 4,
    gap: 12,
  },
  quizCardContent: {
    flex: 1,
  },
  quizCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quizCardTitle: {
    flex: 1,
    marginRight: 8,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreBadgeText: {},
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {},
  quizCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quizMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quizMetaDot: {
    width: 8,
    height: 8,
  },
  quizMetaText: {},
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {},
  historyItemMeta: {
    marginTop: 2,
  },
  historyItemScore: {},
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
  createContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  chipScroll: {
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  hint: {
    fontStyle: 'italic',
  },
  questionForm: {
    paddingHorizontal: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  optionsContainer: {},
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    marginBottom: 6,
    gap: 10,
  },
  optionInput: {
    flex: 1,
    padding: 0,
  },
  tfContainer: {},
  tfRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    gap: 8,
  },
  takingContent: {
    padding: 16,
    paddingBottom: 40,
  },
  progressSection: {},
  progressLabel: {},
  questionText: {
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 28,
  },
  fillBlankResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
  },
  explanationBox: {
    flexDirection: 'row',
    padding: 12,
    marginTop: 12,
    gap: 10,
    borderLeftWidth: 3,
  },
  explanationText: {
    flex: 1,
    lineHeight: 20,
  },
  takingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resultContent: {
    paddingBottom: 40,
  },
  resultCard: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    gap: 8,
  },
  resultScore: {},
  resultPercentage: {},
  resultMessage: {
    textAlign: 'center',
    marginTop: 4,
  },
  reviewItem: {
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  reviewQuestion: {},
  reviewAnswerRow: {
    marginTop: 8,
    marginLeft: 30,
    gap: 4,
  },
  resultActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
  },
});
