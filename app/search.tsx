import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useNoteStore } from '@/store/useNoteStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import { db } from '@/database';
import Header from '@/components/Header';
import NoteCard from '@/components/NoteCard';
import EmptyState from '@/components/EmptyState';
import type { Note, NoteType } from '@/types';
import { NOTE_TYPES } from '@/constants';

const MAX_RECENT = 8;

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const { subjects, loadSubjects } = useSubjectStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null);
  const [filterNoteType, setFilterNoteType] = useState<NoteType | null>(null);
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterImportant, setFilterImportant] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSubjects();
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  const getSubjectName = useCallback(
    (subjectId: string) => {
      return subjects.find((s) => s.id === subjectId)?.name ?? '';
    },
    [subjects]
  );

  const executeSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      let raw = db.searchNotes(trimmed);
      let mapped: Note[] = raw.map((n: any) => ({
        id: n.id,
        subjectId: n.subject_id,
        chapterId: n.chapter_id,
        title: n.title,
        content: n.content,
        type: n.type,
        tags: db.getTagsByNote(n.id).map((t: any) => t.name),
        isFavorite: n.is_favorite === 1,
        isBookmarked: n.is_bookmarked === 1,
        isPinned: n.is_pinned === 1,
        isImportant: n.is_important === 1,
        isArchived: n.is_archived === 1,
        attachments: [],
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }));
      if (filterSubjectId) {
        mapped = mapped.filter((n) => n.subjectId === filterSubjectId);
      }
      if (filterNoteType) {
        mapped = mapped.filter((n) => n.type === filterNoteType);
      }
      if (filterFavorite) {
        mapped = mapped.filter((n) => n.isFavorite);
      }
      if (filterImportant) {
        mapped = mapped.filter((n) => n.isImportant);
      }
      setResults(mapped);
      setHasSearched(true);
      if (trimmed.length > 0) {
        setRecentSearches((prev) => {
          const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
          return [trimmed, ...filtered].slice(0, MAX_RECENT);
        });
      }
    },
    [filterSubjectId, filterNoteType, filterFavorite, filterImportant]
  );

  useEffect(() => {
    if (hasSearched && query.trim()) {
      executeSearch(query);
    }
  }, [filterSubjectId, filterNoteType, filterFavorite, filterImportant]);

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();
    executeSearch(query);
  }, [query, executeSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  }, []);

  const handleRecentPress = useCallback(
    (term: string) => {
      setQuery(term);
      executeSearch(term);
    },
    [executeSearch]
  );

  const handleClearRecent = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const highlightText = useCallback(
    (text: string, maxLines: number = 2) => {
      if (!query.trim() || !text) return <Text numberOfLines={maxLines}>{text}</Text>;
      const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      return (
        <Text numberOfLines={maxLines}>
          {parts.map((part, i) =>
            regex.test(part) ? (
              <Text key={i} style={{ backgroundColor: theme.colors.warningLight, color: theme.colors.text }}>
                {part}
              </Text>
            ) : (
              <Text key={i}>{part}</Text>
            )
          )}
        </Text>
      );
    },
    [query, theme]
  );

  const clearFilter = useCallback((filter: string) => {
    switch (filter) {
      case 'subject':
        setFilterSubjectId(null);
        break;
      case 'type':
        setFilterNoteType(null);
        break;
      case 'favorite':
        setFilterFavorite(false);
        break;
      case 'important':
        setFilterImportant(false);
        break;
    }
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterSubjectId) count++;
    if (filterNoteType) count++;
    if (filterFavorite) count++;
    if (filterImportant) count++;
    return count;
  }, [filterSubjectId, filterNoteType, filterFavorite, filterImportant]);

  const renderRecentItem = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        style={[styles.recentItem, { borderBottomColor: theme.colors.borderLight }]}
        onPress={() => handleRecentPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Search for ${item}`}
      >
        <MaterialCommunityIcons name="history" size={18} color={theme.colors.textMuted} />
        <Text
          style={[
            styles.recentText,
            { color: theme.colors.text, fontSize: theme.fontSize.md },
          ]}
          numberOfLines={1}
        >
          {item}
        </Text>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => {
            setRecentSearches((prev) => prev.filter((s) => s !== item));
          }}
          accessibilityLabel={`Remove ${item} from recent searches`}
        >
          <MaterialCommunityIcons name="close" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [theme, handleRecentPress]
  );

  const renderResultItem = useCallback(
    ({ item }: { item: Note }) => (
      <NoteCard
        note={item}
        subjectName={getSubjectName(item.subjectId)}
        onPress={() => router.push(`/note/${item.id}` as any)}
      />
    ),
    [getSubjectName, router]
  );

  const ListHeader = useMemo(() => {
    if (!hasSearched && !query.trim()) {
      return null;
    }
    if (hasSearched && query.trim()) {
      return (
        <View style={styles.resultCountContainer}>
          <Text
            style={[
              styles.resultCount,
              { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
            ]}
          >
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </Text>
        </View>
      );
    }
    return null;
  }, [hasSearched, query, results.length, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Search" showBack onBack={() => router.back()} />

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: theme.borderRadius.md,
              borderColor: query ? theme.colors.primary : 'transparent',
              borderWidth: query ? 1.5 : 0,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={[
              styles.searchInput,
              { color: theme.colors.text, fontSize: theme.fontSize.md },
            ]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            placeholder="Search notes..."
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search notes"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Clear search"
            >
              <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: activeFilterCount > 0 ? theme.colors.primaryLight : 'transparent',
              borderRadius: theme.borderRadius.sm,
            },
          ]}
          onPress={() => setShowFilters(!showFilters)}
          accessibilityRole="button"
          accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={22}
            color={activeFilterCount > 0 ? theme.colors.primary : theme.colors.textMuted}
          />
          {activeFilterCount > 0 && (
            <View
              style={[
                styles.filterBadge,
                { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full },
              ]}
            >
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View
          style={[
            styles.filtersPanel,
            { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
          ]}
        >
          <View style={styles.filterSection}>
            <Text
              style={[
                styles.filterSectionTitle,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
              ]}
            >
              Subject
            </Text>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: !filterSubjectId ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderRadius: theme.borderRadius.full,
                    borderWidth: 1,
                    borderColor: !filterSubjectId ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setFilterSubjectId(null)}
                accessibilityRole="radio"
                accessibilityState={{ checked: !filterSubjectId }}
              >
                <Text
                  style={{
                    color: !filterSubjectId ? '#FFFFFF' : theme.colors.text,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.medium,
                  }}
                >
                  All
                </Text>
              </TouchableOpacity>
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: filterSubjectId === s.id ? s.color : theme.colors.surfaceVariant,
                      borderRadius: theme.borderRadius.full,
                      borderWidth: 1,
                      borderColor: filterSubjectId === s.id ? s.color : theme.colors.border,
                    },
                  ]}
                  onPress={() => setFilterSubjectId(filterSubjectId === s.id ? null : s.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: filterSubjectId === s.id }}
                >
                  <Text
                    style={{
                      color: filterSubjectId === s.id ? '#FFFFFF' : theme.colors.text,
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                    }}
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text
              style={[
                styles.filterSectionTitle,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
              ]}
            >
              Note Type
            </Text>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: !filterNoteType ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderRadius: theme.borderRadius.full,
                    borderWidth: 1,
                    borderColor: !filterNoteType ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setFilterNoteType(null)}
                accessibilityRole="radio"
                accessibilityState={{ checked: !filterNoteType }}
              >
                <Text
                  style={{
                    color: !filterNoteType ? '#FFFFFF' : theme.colors.text,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.medium,
                  }}
                >
                  All
                </Text>
              </TouchableOpacity>
              {NOTE_TYPES.map((nt) => (
                <TouchableOpacity
                  key={nt.type}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        filterNoteType === nt.type ? nt.color : theme.colors.surfaceVariant,
                      borderRadius: theme.borderRadius.full,
                      borderWidth: 1,
                      borderColor:
                        filterNoteType === nt.type ? nt.color : theme.colors.border,
                    },
                  ]}
                  onPress={() =>
                    setFilterNoteType(filterNoteType === nt.type ? null : (nt.type as NoteType))
                  }
                  accessibilityRole="radio"
                  accessibilityState={{ checked: filterNoteType === nt.type }}
                >
                  <Text
                    style={{
                      color: filterNoteType === nt.type ? '#FFFFFF' : theme.colors.text,
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                    }}
                    numberOfLines={1}
                  >
                    {nt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterToggleRow}>
            <TouchableOpacity
              style={[
                styles.filterToggle,
                {
                  backgroundColor: filterFavorite ? theme.colors.errorLight : theme.colors.surfaceVariant,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 1,
                  borderColor: filterFavorite ? theme.colors.error : theme.colors.border,
                },
              ]}
              onPress={() => setFilterFavorite(!filterFavorite)}
              accessibilityRole="togglebutton"
              accessibilityState={{ checked: filterFavorite }}
            >
              <MaterialCommunityIcons
                name={filterFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={filterFavorite ? theme.colors.error : theme.colors.textMuted}
              />
              <Text
                style={{
                  color: filterFavorite ? theme.colors.error : theme.colors.textSecondary,
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.medium,
                  marginLeft: 6,
                }}
              >
                Favorites
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterToggle,
                {
                  backgroundColor: filterImportant ? theme.colors.warningLight : theme.colors.surfaceVariant,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 1,
                  borderColor: filterImportant ? theme.colors.warning : theme.colors.border,
                },
              ]}
              onPress={() => setFilterImportant(!filterImportant)}
              accessibilityRole="togglebutton"
              accessibilityState={{ checked: filterImportant }}
            >
              <MaterialCommunityIcons
                name={filterImportant ? 'star' : 'star-outline'}
                size={18}
                color={filterImportant ? theme.colors.warning : theme.colors.textMuted}
              />
              <Text
                style={{
                  color: filterImportant ? theme.colors.warning : theme.colors.textSecondary,
                  fontSize: theme.fontSize.xs,
                  fontWeight: theme.fontWeight.medium,
                  marginLeft: 6,
                }}
              >
                Important
              </Text>
            </TouchableOpacity>

            {activeFilterCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.clearFiltersButton,
                  { borderRadius: theme.borderRadius.md },
                ]}
                onPress={() => {
                  setFilterSubjectId(null);
                  setFilterNoteType(null);
                  setFilterFavorite(false);
                  setFilterImportant(false);
                }}
                accessibilityLabel="Clear all filters"
              >
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.semibold,
                  }}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {!hasSearched && !query.trim() ? (
        <View style={styles.idleContainer}>
          {recentSearches.length > 0 ? (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text
                  style={[
                    styles.recentTitle,
                    { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold },
                  ]}
                >
                  Recent Searches
                </Text>
                <TouchableOpacity
                  onPress={handleClearRecent}
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent searches"
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.semibold,
                    }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentSearches}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={renderRecentItem}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          ) : (
            <EmptyState
              icon="magnify"
              title="Search Your Notes"
              subtitle="Type to search through all your study notes"
            />
          )}
        </View>
      ) : hasSearched && results.length === 0 ? (
        <EmptyState
          icon="file-search-outline"
          title="No Notes Found"
          subtitle={`No notes match "${query}". Try different keywords or adjust your filters.`}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResultItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  filtersPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  idleContainer: {
    flex: 1,
  },
  recentSection: {
    flex: 1,
    paddingTop: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recentTitle: {},
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentText: {
    flex: 1,
  },
  resultCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultCount: {},
  listContent: {
    paddingBottom: 24,
  },
});
