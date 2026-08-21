import { create } from 'zustand';
import { db } from '../database';
import { Flashcard } from '../types';

interface FlashcardState {
  flashcards: Flashcard[];
  currentCardIndex: number;
  isFlipped: boolean;
  dueCards: Flashcard[];
  setFlashcards: (flashcards: Flashcard[]) => void;
  setCurrentCardIndex: (index: number) => void;
  setIsFlipped: (flipped: boolean) => void;
  setDueCards: (cards: Flashcard[]) => void;
  loadFlashcards: () => void;
  loadFlashcardsBySubject: (subjectId: string) => void;
  createFlashcard: (data: {
    subjectId?: string;
    chapterId?: string;
    question: string;
    answer: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) => Flashcard | null;
  updateFlashcard: (
    id: string,
    data: Partial<Pick<Flashcard, 'question' | 'answer' | 'difficulty'>>
  ) => Flashcard | null;
  deleteFlashcard: (id: string) => boolean;
  loadDueCards: () => void;
  reviewCard: (id: string, nextReview: string) => boolean;
  flipCard: () => void;
  nextCard: () => void;
  previousCard: () => void;
}

function mapDbFlashcard(raw: any): Flashcard {
  return {
    id: raw.id,
    subjectId: raw.subject_id,
    chapterId: raw.chapter_id,
    question: raw.question,
    answer: raw.answer,
    tags: [],
    difficulty: raw.difficulty as Flashcard['difficulty'],
    nextReview: raw.next_review,
    reviewCount: raw.review_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  flashcards: [],
  currentCardIndex: 0,
  isFlipped: false,
  dueCards: [],

  setFlashcards: (flashcards) => set({ flashcards }),
  setCurrentCardIndex: (currentCardIndex) => set({ currentCardIndex }),
  setIsFlipped: (isFlipped) => set({ isFlipped }),
  setDueCards: (dueCards) => set({ dueCards }),

  loadFlashcards: () => {
    const raw = db.getAllFlashcards();
    const flashcards = raw.map(mapDbFlashcard);
    set({ flashcards, currentCardIndex: 0, isFlipped: false });
  },

  loadFlashcardsBySubject: (subjectId) => {
    const raw = db.getFlashcardsBySubject(subjectId);
    const flashcards = raw.map(mapDbFlashcard);
    set({ flashcards, currentCardIndex: 0, isFlipped: false });
  },

  createFlashcard: (data) => {
    const raw = db.createFlashcard({
      subject_id: data.subjectId,
      chapter_id: data.chapterId,
      question: data.question,
      answer: data.answer,
      difficulty: data.difficulty,
    });
    if (!raw) return null;
    const card = mapDbFlashcard(raw);
    set((state) => ({ flashcards: [card, ...state.flashcards] }));
    return card;
  },

  updateFlashcard: (id, data) => {
    const raw = db.updateFlashcard(id, {
      question: data.question,
      answer: data.answer,
      difficulty: data.difficulty,
    });
    if (!raw) return null;
    const updated = mapDbFlashcard(raw);
    set((state) => ({
      flashcards: state.flashcards.map((c) => (c.id === id ? updated : c)),
      dueCards: state.dueCards.map((c) => (c.id === id ? updated : c)),
    }));
    return updated;
  },

  deleteFlashcard: (id) => {
    const success = db.deleteFlashcard(id);
    if (success) {
      set((state) => ({
        flashcards: state.flashcards.filter((c) => c.id !== id),
        dueCards: state.dueCards.filter((c) => c.id !== id),
        currentCardIndex: Math.min(
          state.currentCardIndex,
          Math.max(0, state.flashcards.length - 2)
        ),
      }));
    }
    return success;
  },

  loadDueCards: () => {
    const raw = db.getDueForReview();
    const dueCards = raw.map(mapDbFlashcard);
    set({ dueCards, currentCardIndex: 0, isFlipped: false });
  },

  reviewCard: (id, nextReview) => {
    const success = db.updateReview(id, nextReview);
    if (success) {
      set((state) => ({
        dueCards: state.dueCards.filter((c) => c.id !== id),
        currentCardIndex: Math.min(
          state.currentCardIndex,
          Math.max(0, state.dueCards.length - 2)
        ),
        isFlipped: false,
      }));
    }
    return success;
  },

  flipCard: () => {
    set((state) => ({ isFlipped: !state.isFlipped }));
  },

  nextCard: () => {
    const { currentCardIndex, dueCards } = get();
    if (currentCardIndex < dueCards.length - 1) {
      set({ currentCardIndex: currentCardIndex + 1, isFlipped: false });
    }
  },

  previousCard: () => {
    const { currentCardIndex } = get();
    if (currentCardIndex > 0) {
      set({ currentCardIndex: currentCardIndex - 1, isFlipped: false });
    }
  },
}));
