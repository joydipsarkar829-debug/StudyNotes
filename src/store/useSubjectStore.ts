import { create } from 'zustand';
import { db } from '../database';
import { Subject, Chapter } from '../types';

interface SubjectStats {
  totalSubjects: number;
  totalNotes: number;
  totalChapters: number;
  importantNotes: number;
  bookmarkedNotes: number;
}

interface SubjectState {
  subjects: Subject[];
  currentSubject: Subject | null;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  stats: SubjectStats;
  setSubjects: (subjects: Subject[]) => void;
  setCurrentSubject: (subject: Subject | null) => void;
  setChapters: (chapters: Chapter[]) => void;
  setCurrentChapter: (chapter: Chapter | null) => void;
  setStats: (stats: Partial<SubjectStats>) => void;
  loadSubjects: () => void;
  createSubject: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => Subject | null;
  updateSubject: (
    id: string,
    data: Partial<Pick<Subject, 'name' | 'description' | 'icon' | 'color'>>
  ) => Subject | null;
  deleteSubject: (id: string) => boolean;
  archiveSubject: (id: string) => boolean;
  restoreSubject: (id: string) => boolean;
  loadChapters: (subjectId: string) => void;
  createChapter: (data: {
    subjectId: string;
    title: string;
    description?: string;
  }) => Chapter | null;
  updateChapter: (
    id: string,
    data: Partial<Pick<Chapter, 'title' | 'description'>>
  ) => Chapter | null;
  deleteChapter: (id: string) => boolean;
  reorderChapters: (subjectId: string, ids: string[]) => void;
}

function mapDbSubject(raw: any): Subject {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    icon: raw.icon,
    color: raw.color,
    isArchived: raw.is_archived === 1,
    sortOrder: raw.sort_order,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapDbChapter(raw: any): Chapter {
  return {
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
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  currentSubject: null,
  chapters: [],
  currentChapter: null,
  stats: {
    totalSubjects: 0,
    totalNotes: 0,
    totalChapters: 0,
    importantNotes: 0,
    bookmarkedNotes: 0,
  },

  setSubjects: (subjects) => set({ subjects }),
  setCurrentSubject: (currentSubject) => set({ currentSubject }),
  setChapters: (chapters) => set({ chapters }),
  setCurrentChapter: (currentChapter) => set({ currentChapter }),
  setStats: (stats) => set((state) => ({ stats: { ...state.stats, ...stats } })),

  loadSubjects: () => {
    const rawSubjects = db.getAllSubjects();
    const subjects = rawSubjects.map(mapDbSubject);
    const allNotes = db.getAllNotes();
    const allChapters = db.getAllSubjects().reduce(
      (acc: number, s: any) => acc + db.getChaptersBySubject(s.id).length,
      0
    );
    const importantNotes = allNotes.filter((n: any) => n.is_important === 1).length;
    const bookmarkedNotes = allNotes.filter((n: any) => n.is_bookmarked === 1).length;

    set({
      subjects,
      stats: {
        totalSubjects: subjects.length,
        totalNotes: allNotes.length,
        totalChapters: allChapters,
        importantNotes,
        bookmarkedNotes,
      },
    });
  },

  createSubject: (data) => {
    const raw = db.createSubject({
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
    });
    if (!raw) return null;
    const subject = mapDbSubject(raw);
    set((state) => ({ subjects: [...state.subjects, subject] }));
    return subject;
  },

  updateSubject: (id, data) => {
    const raw = db.updateSubject(id, {
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
    });
    if (!raw) return null;
    const updated = mapDbSubject(raw);
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? updated : s)),
      currentSubject: state.currentSubject?.id === id ? updated : state.currentSubject,
    }));
    return updated;
  },

  deleteSubject: (id) => {
    const success = db.deleteSubject(id);
    if (success) {
      set((state) => ({
        subjects: state.subjects.filter((s) => s.id !== id),
        currentSubject: state.currentSubject?.id === id ? null : state.currentSubject,
      }));
    }
    return success;
  },

  archiveSubject: (id) => {
    const success = db.archiveSubject(id);
    if (success) {
      set((state) => ({
        subjects: state.subjects.filter((s) => s.id !== id),
        currentSubject: state.currentSubject?.id === id ? null : state.currentSubject,
      }));
    }
    return success;
  },

  restoreSubject: (id) => {
    const success = db.restoreSubject(id);
    if (success) {
      get().loadSubjects();
    }
    return success;
  },

  loadChapters: (subjectId) => {
    const rawChapters = db.getChaptersBySubject(subjectId);
    const chapters = rawChapters.map(mapDbChapter);
    set({ chapters });
  },

  createChapter: (data) => {
    const raw = db.createChapter({
      subject_id: data.subjectId,
      title: data.title,
      description: data.description,
    });
    if (!raw) return null;
    const chapter = mapDbChapter(raw);
    set((state) => ({ chapters: [...state.chapters, chapter] }));
    return chapter;
  },

  updateChapter: (id, data) => {
    const raw = db.updateChapter(id, {
      title: data.title,
      description: data.description,
    });
    if (!raw) return null;
    const updated = mapDbChapter(raw);
    set((state) => ({
      chapters: state.chapters.map((c) => (c.id === id ? updated : c)),
      currentChapter: state.currentChapter?.id === id ? updated : state.currentChapter,
    }));
    return updated;
  },

  deleteChapter: (id) => {
    const success = db.deleteChapter(id);
    if (success) {
      set((state) => ({
        chapters: state.chapters.filter((c) => c.id !== id),
        currentChapter: state.currentChapter?.id === id ? null : state.currentChapter,
      }));
    }
    return success;
  },

  reorderChapters: (subjectId, ids) => {
    db.reorderChapters(subjectId, ids);
    get().loadChapters(subjectId);
  },
}));
