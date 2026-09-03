import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useNoteStore } from '@/store/useNoteStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import FilterChip from '@/components/FilterChip';
import NoteCard from '@/components/NoteCard';
import EmptyState from '@/components/EmptyState';
import FAB from '@/components/FAB';
import { NoteType } from '@/types';

type SortOption = 'recent' | 'title' | 'oldest';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'recent', label: 'Recent', icon: 'clock-outline' },
  { key: 'title', label: 'Title A-Z', icon: 'sort-alphabetical-ascending' },
  { key: 'oldest', label: 'Oldest', icon: 'sort-calendar-ascending' },
];

const NOTE_TYPE_FILTERS: { type: NoteType; label: string }[] = [
  { type: NoteType.Normal, label: 'Normal' },
  { type: NoteType.Quick, label: 'Quick' },
  { type: NoteType.Revision, label: 'Revision' },
  { type: NoteType.Formula, label: 'Formula' },
  { type: NoteType.QA, label: 'Q&A' },
  { type: NoteType.Definition, label: 'Definition' },
  { type: NoteType.ImportantTopic, label: 'Important' },
  { type: NoteType.Assignment, label: 'Assignment' },
  { type: NoteType.Todo, label: 'To-Do' },
  { type: NoteType.ExamPrep, label: 'Exam Prep' },
];

export default function NotesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { notes, loadNotes, searchQuery, setSearchQuery } = useNoteStore();
  const { subjects, loadSubjects } = useSubjectStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeNoteType, setActiveNoteType] = useState<NoteType | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    loadNotes();
    loadSubjects();
  }, []);

  const subjectMap = useMemo(() => {
    const map: Record<string, string> = {};
    subjects.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [subjects]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    switch (activeFilter) {
      case 'favorites':
        result = result.filter((n) => n.isFavorite);
        break;
      case 'important':
        result = result.filter((n) => n.isImportant);
        break;
      case 'bookmarked':
        result = result.filter((n) => n.isBookmarked);
        break;
      case 'pinned':
        result = result.filter((n) => n.isPinned);
        break;
    }

    if (activeNoteType) {
      result = result.filter((n) => n.type === activeNoteType);
    }

    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [notes, searchQuery, activeFilter, activeNoteType, sortBy]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotes();
    loadSubjects();
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleFilterPress = useCallback((filter: string) => {
    setActiveFilter((prev) => (prev === filter ? 'all' : filter));
  }, []);

  const handleNoteTypeFilter = useCallback((type: NoteType) => {
    setActiveNoteType((prev) => (prev === type ? null : type));
  }, []);

  const handleNotePress = useCallback(
    (noteId: string) => {
      router.push(`/note/${noteId}`);
    },
    [router]
  );

  const handleCreateNote = useCallback(() => {
    router.push('/note/editor');
  }, [router]);

  const handleSortSelect = useCallback((option: SortOption) => {
    setSortBy(option);
    setShowSortModal(false);
  }, []);

  const renderNoteCard = useCallback(
    ({ item }: { item: any }) => (
      <NoteCard
        note={item}
        subjectName={subjectMap[item.subjectId]}
        onPress={() => handleNotePress(item.id)}
      />
    ),
    [subjectMap, handleNotePress]
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Notes"
        rightActions={[
          { icon: 'sort-variant', onPress: () => setShowSortModal(true), label: 'Sort' },
        ]}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notes..."
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <FilterChip
            label="All"
            selected={activeFilter === 'all' && !activeNoteType}
            onPress={() => {
              setActiveFilter('all');
              setActiveNoteType(null);
            }}
          />
          <FilterChip
            label="Favorites"
            icon="heart"
            selected={activeFilter === 'favorites'}
            onPress={() => handleFilterPress('favorites')}
          />
          <FilterChip
            label="Important"
            icon="star"
            selected={activeFilter === 'important'}
            onPress={() => handleFilterPress('important')}
          />
          <FilterChip
            label="Bookmarked"
            icon="bookmark"
            selected={activeFilter === 'bookmarked'}
            onPress={() => handleFilterPress('bookmarked')}
          />
          <FilterChip
            label="Pinned"
            icon="pin"
            selected={activeFilter === 'pinned'}
            onPress={() => handleFilterPress('pinned')}
          />
          {NOTE_TYPE_FILTERS.map((nt) => (
            <FilterChip
              key={nt.type}
              label={nt.label}
              selected={activeNoteType === nt.type}
              onPress={() => handleNoteTypeFilter(nt.type)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={
          filteredNotes.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyState
            icon="note-text-outline"
            title="No notes found"
            subtitle="Create your first study note to get started"
            actionTitle="Create Note"
            onAction={handleCreateNote}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      <FAB icon="plus" onPress={handleCreateNote} />

      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={[styles.sortOverlay, { backgroundColor: theme.colors.overlay }]}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sortModal,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.sortTitle,
                {
                  color: theme.colors.text,
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.bold as any,
                },
              ]}
            >
              Sort By
            </Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  {
                    backgroundColor:
                      sortBy === option.key
                        ? theme.colors.primaryLight
                        : 'transparent',
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                onPress={() => handleSortSelect(option.key)}
                accessibilityLabel={`Sort by ${option.label}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: sortBy === option.key }}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={20}
                  color={
                    sortBy === option.key
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sortOptionText,
                    {
                      color:
                        sortBy === option.key
                          ? theme.colors.primary
                          : theme.colors.text,
                      fontSize: theme.fontSize.md,
                      fontWeight: (sortBy === option.key
                        ? theme.fontWeight.semibold
                        : theme.fontWeight.normal) as any,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterContainer: {
    paddingBottom: 4,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  sortOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sortModal: {
    width: '100%',
    padding: 20,
  },
  sortTitle: {
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 12,
  },
  sortOptionText: {
    flex: 1,
  },
});
