import { create } from 'zustand';
import { db } from '../database';
import { Quiz, QuizQuestion } from '../types';

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  quizHistory: Quiz[];
  setQuizzes: (quizzes: Quiz[]) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswers: (answers: Record<string, string>) => void;
  loadQuizzes: () => void;
  loadQuizHistory: () => void;
  createQuiz: (data: {
    subjectId?: string;
    chapterId?: string;
    title: string;
    type?: 'mcq' | 'true_false' | 'fill_blank' | 'mixed';
  }) => Quiz | null;
  deleteQuiz: (id: string) => boolean;
  startQuiz: (quizId: string) => Quiz | null;
  answerQuestion: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  completeQuiz: () => Quiz | null;
  resetQuiz: () => void;
  getQuizQuestions: (quizId: string) => QuizQuestion[];
  addQuizQuestion: (data: {
    quizId: string;
    question: string;
    options?: string[];
    correctAnswer: string;
    type?: 'mcq' | 'true_false' | 'fill_blank';
    explanation?: string;
  }) => QuizQuestion | null;
}

function mapDbQuiz(raw: any): Quiz {
  return {
    id: raw.id,
    subjectId: raw.subject_id,
    chapterId: raw.chapter_id,
    title: raw.title,
    type: raw.type as Quiz['type'],
    questions: [],
    score: raw.score,
    totalQuestions: raw.total_questions,
    createdAt: raw.created_at,
    completedAt: raw.completed_at,
  };
}

function mapDbQuizQuestion(raw: any): QuizQuestion {
  let options: string[];
  try {
    options = JSON.parse(raw.options);
  } catch {
    options = [];
  }
  return {
    id: raw.id,
    quizId: raw.quiz_id,
    question: raw.question,
    options,
    correctAnswer: parseInt(raw.correct_answer, 10),
    type: raw.type as QuizQuestion['type'],
    explanation: raw.explanation,
  };
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  currentQuiz: null,
  currentQuestionIndex: 0,
  answers: {},
  quizHistory: [],

  setQuizzes: (quizzes) => set({ quizzes }),
  setCurrentQuiz: (currentQuiz) => set({ currentQuiz }),
  setCurrentQuestionIndex: (currentQuestionIndex) => set({ currentQuestionIndex }),
  setAnswers: (answers) => set({ answers }),

  loadQuizzes: () => {
    const raw = db.getAllQuizzes();
    const quizzes = raw.map(mapDbQuiz);
    set({ quizzes });
  },

  loadQuizHistory: () => {
    const raw = db.getQuizHistory();
    const quizHistory = raw.map(mapDbQuiz);
    set({ quizHistory });
  },

  createQuiz: (data) => {
    const raw = db.createQuiz({
      subject_id: data.subjectId,
      chapter_id: data.chapterId,
      title: data.title,
      type: data.type,
    });
    if (!raw) return null;
    const quiz = mapDbQuiz(raw);
    set((state) => ({ quizzes: [quiz, ...state.quizzes] }));
    return quiz;
  },

  deleteQuiz: (id) => {
    const success = db.deleteQuiz(id);
    if (success) {
      set((state) => ({
        quizzes: state.quizzes.filter((q) => q.id !== id),
        currentQuiz: state.currentQuiz?.id === id ? null : state.currentQuiz,
      }));
    }
    return success;
  },

  startQuiz: (quizId) => {
    const raw = db.getQuizById(quizId);
    if (!raw) return null;
    const quiz = mapDbQuiz(raw);
    const questionRaw = db.getQuizQuestions(quizId);
    quiz.questions = questionRaw.map(mapDbQuizQuestion);
    set({
      currentQuiz: quiz,
      currentQuestionIndex: 0,
      answers: {},
    });
    return quiz;
  },

  answerQuestion: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }));
  },

  nextQuestion: () => {
    const { currentQuiz, currentQuestionIndex } = get();
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  completeQuiz: () => {
    const { currentQuiz, answers } = get();
    if (!currentQuiz) return null;

    let score = 0;
    currentQuiz.questions.forEach((q) => {
      if (answers[q.id] !== undefined && parseInt(answers[q.id], 10) === q.correctAnswer) {
        score++;
      }
    });

    const updated = db.updateQuiz(currentQuiz.id, {
      score,
      total_questions: currentQuiz.questions.length,
      completed_at: new Date().toISOString(),
    });

    if (updated) {
      const completedQuiz = mapDbQuiz(updated);
      completedQuiz.questions = currentQuiz.questions;
      set((state) => ({
        currentQuiz: null,
        currentQuestionIndex: 0,
        answers: {},
        quizzes: state.quizzes.map((q) => (q.id === completedQuiz.id ? completedQuiz : q)),
        quizHistory: [completedQuiz, ...state.quizHistory],
      }));
      return completedQuiz;
    }
    return null;
  },

  resetQuiz: () => {
    set({
      currentQuiz: null,
      currentQuestionIndex: 0,
      answers: {},
    });
  },

  getQuizQuestions: (quizId) => {
    const raw = db.getQuizQuestions(quizId);
    return raw.map(mapDbQuizQuestion);
  },

  addQuizQuestion: (data) => {
    const raw = db.createQuizQuestion({
      quiz_id: data.quizId,
      question: data.question,
      options: data.options ? JSON.stringify(data.options) : undefined,
      correct_answer: data.correctAnswer,
      type: data.type,
      explanation: data.explanation,
    });
    if (!raw) return null;
    return mapDbQuizQuestion(raw);
  },
}));
