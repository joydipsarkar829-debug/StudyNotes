import { create } from 'zustand';
import { db } from '../database';
import { Note, NoteType, Attachment } from '../types';

interface NoteFilters {
  subjectId: string | null;
  chapterId: string | null;
  noteType: NoteType | null;
  isFavorite: boolean | null;
  isImportant: boolean | null;
  tagId: string | null;
}

interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  searchQuery: string;
  searchResults: Note[];
  selectedFilters: NoteFilters;
  setNotes: (notes: Note[]) => void;
  setCurrentNote: (note: Note | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Note[]) => void;
  setFilters: (filters: Partial<NoteFilters>) => void;
  clearFilters: () => void;
  loadNotes: () => void;
  createNote: (data: {
    subjectId?: string;
    chapterId?: string;
    title: string;
    content?: string;
    type?: NoteType;
  }) => Note | null;
  updateNote: (
    id: string,
    data: Partial<Pick<Note, 'title' | 'content' | 'type' | 'subjectId' | 'chapterId'>>
  ) => Note | null;
  deleteNote: (id: string) => boolean;
  toggleFavorite: (id: string) => boolean;
  toggleBookmark: (id: string) => boolean;
  togglePin: (id: string) => boolean;
  toggleImportant: (id: string) => boolean;
  archiveNote: (id: string) => boolean;
  restoreNote: (id: string) => boolean;
  searchNotes: (query: string) => Note[];
  loadFavorites: () => Note[];
  loadBookmarked: () => Note[];
  loadPinned: () => Note[];
  loadImportant: () => Note[];
  loadRecent: (limit?: number) => Note[];
}

function mapDbNote(raw: any): Note {
  return {
    id: raw.id,
    subjectId: raw.subject_id,
    chapterId: raw.chapter_id,
    title: raw.title,
    content: raw.content,
    type: raw.type as NoteType,
    tags: [],
    isFavorite: raw.is_favorite === 1,
    isBookmarked: raw.is_bookmarked === 1,
    isPinned: raw.is_pinned === 1,
    isImportant: raw.is_important === 1,
    isArchived: raw.is_archived === 1,
    attachments: [],
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapDbNoteWithRelations(raw: any, tags: string[], attachments: Attachment[]): Note {
  const note = mapDbNote(raw);
  note.tags = tags;
  note.attachments = attachments;
  return note;
}

const defaultFilters: NoteFilters = {
  subjectId: null,
  chapterId: null,
  noteType: null,
  isFavorite: null,
  isImportant: null,
  tagId: null,
};

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  currentNote: null,
  searchQuery: '',
  searchResults: [],
  selectedFilters: { ...defaultFilters },

  setNotes: (notes) => set({ notes }),
  setCurrentNote: (currentNote) => set({ currentNote }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),

  setFilters: (filters) =>
    set((state) => ({
      selectedFilters: { ...state.selectedFilters, ...filters },
    })),

  clearFilters: () => set({ selectedFilters: { ...defaultFilters } }),

  loadNotes: () => {
    const rawNotes = db.getAllNotes();
    const notes = rawNotes.map((n) => {
      const tags = db.getTagsByNote(n.id).map((t) => t.name);
      const attachments = db.getAttachmentsByNote(n.id).map((a) => ({
        id: a.id,
        noteId: a.note_id,
        type: a.type as Attachment['type'],
        uri: a.uri,
        name: a.name,
        size: a.size,
        mimeType: a.mime_type,
        createdAt: a.created_at,
      }));
      return mapDbNoteWithRelations(n, tags, attachments);
    });
    set({ notes });
  },

  createNote: (data) => {
    const raw = db.createNote({
      subject_id: data.subjectId,
      chapter_id: data.chapterId,
      title: data.title,
      content: data.content,
      type: data.type,
    });
    if (!raw) return null;
    const note = mapDbNote(raw);
    set((state) => ({ notes: [note, ...state.notes] }));
    return note;
  },

  updateNote: (id, data) => {
    const raw = db.updateNote(id, {
      title: data.title,
      content: data.content,
      type: data.type,
      subject_id: data.subjectId,
      chapter_id: data.chapterId,
    });
    if (!raw) return null;
    const updated = mapDbNote(raw);
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? updated : n)),
      currentNote: state.currentNote?.id === id ? updated : state.currentNote,
    }));
    return updated;
  },

  deleteNote: (id) => {
    const success = db.deleteNote(id);
    if (success) {
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
      }));
    }
    return success;
  },

  toggleFavorite: (id) => {
    const success = db.toggleFavorite(id);
    if (success) {
      const raw = db.getNoteById(id);
      if (raw) {
        const updated = mapDbNote(raw);
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? updated : n)),
          currentNote: state.currentNote?.id === id ? updated : state.currentNote,
        }));
      }
    }
    return success;
  },

  toggleBookmark: (id) => {
    const success = db.toggleBookmark(id);
    if (success) {
      const raw = db.getNoteById(id);
      if (raw) {
        const updated = mapDbNote(raw);
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? updated : n)),
          currentNote: state.currentNote?.id === id ? updated : state.currentNote,
        }));
      }
    }
    return success;
  },

  togglePin: (id) => {
    const success = db.togglePin(id);
    if (success) {
      const raw = db.getNoteById(id);
      if (raw) {
        const updated = mapDbNote(raw);
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? updated : n)),
          currentNote: state.currentNote?.id === id ? updated : state.currentNote,
        }));
      }
    }
    return success;
  },

  toggleImportant: (id) => {
    const success = db.toggleImportant(id);
    if (success) {
      const raw = db.getNoteById(id);
      if (raw) {
        const updated = mapDbNote(raw);
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? updated : n)),
          currentNote: state.currentNote?.id === id ? updated : state.currentNote,
        }));
      }
    }
    return success;
  },

  archiveNote: (id) => {
    const success = db.archiveNote(id);
    if (success) {
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
      }));
    }
    return success;
  },

  restoreNote: (id) => {
    const success = db.restoreNote(id);
    if (success) {
      get().loadNotes();
    }
    return success;
  },

  searchNotes: (query) => {
    const rawResults = db.searchNotes(query);
    const results = rawResults.map(mapDbNote);
    set({ searchResults: results, searchQuery: query });
    return results;
  },

  loadFavorites: () => {
    const rawNotes = db.getFavoriteNotes();
    return rawNotes.map(mapDbNote);
  },

  loadBookmarked: () => {
    const rawNotes = db.getBookmarkedNotes();
    return rawNotes.map(mapDbNote);
  },

  loadPinned: () => {
    const rawNotes = db.getPinnedNotes();
    return rawNotes.map(mapDbNote);
  },

  loadImportant: () => {
    const rawNotes = db.getImportantNotes();
    return rawNotes.map(mapDbNote);
  },

  loadRecent: (limit = 10) => {
    const rawNotes = db.getRecentNotes(limit);
    return rawNotes.map(mapDbNote);
  },
}));
