import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/store/useSubjectStore';
import { db } from '@/database';
import Header from '@/components/Header';
import SubjectCard from '@/components/SubjectCard';
import EmptyState from '@/components/EmptyState';
import FAB from '@/components/FAB';
import type { Subject } from '@/types';

export default function SubjectsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { subjects, loadSubjects } = useSubjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedSubjects, setArchivedSubjects] = useState<Subject[]>([]);
  const [subjectMeta, setSubjectMeta] = useState<
    Record<string, { chapterCount: number; noteCount: number }>
  >({});

  const loadData = useCallback(() => {
    loadSubjects();
    const archived = db.getArchivedSubjects().map((raw: any) => ({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      icon: raw.icon,
      color: raw.color,
      isArchived: raw.is_archived === 1,
      sortOrder: raw.sort_order,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    }));
    setArchivedSubjects(archived);

    const meta: Record<string, { chapterCount: number; noteCount: number }> = {};
    const allSubjects = [...subjects, ...archived];
    allSubjects.forEach((s) => {
      const chapters = db.getChaptersBySubject(s.id);
      const notes = db.getNotesBySubject(s.id);
      meta[s.id] = { chapterCount: chapters.length, noteCount: notes.length };
    });
    setSubjectMeta(meta);
  }, [loadSubjects, subjects]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const filteredSubjects = useMemo(() => {
    const list = showArchived ? archivedSubjects : subjects;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [subjects, archivedSubjects, searchQuery, showArchived]);

  const handleRestore = useCallback(
    (id: string) => {
      useSubjectStore.getState().restoreSubject(id);
      loadData();
    },
    [loadData]
  );

  const renderItem = useCallback(
    ({ item }: { item: Subject }) => {
      const meta = subjectMeta[item.id] || { chapterCount: 0, noteCount: 0 };
      return (
        <View style={styles.cardWrapper}>
          <SubjectCard
            subject={item}
            chapterCount={meta.chapterCount}
            noteCount={meta.noteCount}
            onPress={() => router.push(`/subject/${item.id}` as any)}
          />
          {showArchived && (
            <TouchableOpacity
              style={[styles.restoreButton, { backgroundColor: theme.colors.successLight }]}
              onPress={() => handleRestore(item.id)}
              accessibilityLabel="Restore subject"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="restore"
                size={18}
                color={theme.colors.success}
              />
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [subjectMeta, router, showArchived, handleRestore, theme]
  );

  const keyExtractor = useCallback((item: Subject) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Subjects" />

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={theme.colors.textMuted}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text, fontSize: theme.fontSize.md }]}
          placeholder="Search subjects..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.archiveToggle, { backgroundColor: showArchived ? theme.colors.primaryLight : theme.colors.surface }]}
        onPress={() => setShowArchived(!showArchived)}
        accessibilityRole="button"
        accessibilityLabel={showArchived ? 'Show active subjects' : 'Show archived subjects'}
      >
        <MaterialCommunityIcons
          name={showArchived ? 'archive-arrow-up' : 'archive'}
          size={18}
          color={showArchived ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text
          style={[
            styles.archiveToggleText,
            {
              color: showArchived ? theme.colors.primary : theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          {showArchived ? 'Active Subjects' : 'Archived'}
        </Text>
      </TouchableOpacity>

      {filteredSubjects.length === 0 && !searchQuery ? (
        <EmptyState
          icon="book-open-variant"
          title={showArchived ? 'No Archived Subjects' : 'No Subjects Yet'}
          subtitle={
            showArchived
              ? 'Archived subjects will appear here.'
              : 'Create your first subject to start organizing your notes.'
          }
          actionTitle={showArchived ? undefined : 'Create Subject'}
          onAction={showArchived ? undefined : () => router.push('/subject/new' as any)}
        />
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon="magnify-close"
          title="No Results Found"
          subtitle={`No subjects match "${searchQuery}"`}
        />
      ) : (
        <FlatList
          data={filteredSubjects}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      {!showArchived && (
        <FAB icon="plus" onPress={() => router.push('/subject/new' as any)} />
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
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    padding: 0,
  },
  archiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  archiveToggleText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
    position: 'relative',
  },
  restoreButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
