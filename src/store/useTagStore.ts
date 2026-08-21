import { create } from 'zustand';
import { db } from '../database';
import { Tag } from '../types';

interface TagState {
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
  loadTags: () => void;
  createTag: (data: { name: string; color?: string }) => Tag | null;
  updateTag: (id: string, data: Partial<Pick<Tag, 'name' | 'color'>>) => Tag | null;
  deleteTag: (id: string) => boolean;
}

function mapDbTag(raw: any): Tag {
  return {
    id: raw.id,
    name: raw.name,
    color: raw.color,
    createdAt: raw.created_at,
  };
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],

  setTags: (tags) => set({ tags }),

  loadTags: () => {
    const rawTags = db.getAllTags();
    const tags = rawTags.map(mapDbTag);
    set({ tags });
  },

  createTag: (data) => {
    const raw = db.createTag({ name: data.name, color: data.color });
    if (!raw) return null;
    const tag = mapDbTag(raw);
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  updateTag: (id, data) => {
    const raw = db.updateTag(id, { name: data.name, color: data.color });
    if (!raw) return null;
    const updated = mapDbTag(raw);
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? updated : t)),
    }));
    return updated;
  },

  deleteTag: (id) => {
    const success = db.deleteTag(id);
    if (success) {
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
      }));
    }
    return success;
  },
}));
