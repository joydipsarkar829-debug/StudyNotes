import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Header from '@/components/Header';
import NoteCard from '@/components/NoteCard';
import EmptyState from '@/components/EmptyState';
import SectionHeader from '@/components/SectionHeader';
import { useTheme } from '@/theme';
import { useNoteStore } from '@/store/useNoteStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import type { Note } from '@/types';

export default function BookmarksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { loadBookmarked, toggleBookmark, loadNotes } = useNoteStore();
  const { subjects, loadSubjects } = useSubjectStore();

  const [bookmarks, setBookmarks] = useState<Note[]>(() => {
    loadSubjects();
    const raw = loadBookmarked();
    return raw;
  });

  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjects) map.set(s.id, s.name);
    return map;
  }, [subjects]);

  const getSubjectName = useCallback(
    (subjectId: string) => subjectMap.get(subjectId) ?? '',
    [subjectMap]
  );

  const refreshList = useCallback(() => {
    loadNotes();
    loadSubjects();
    setBookmarks(loadBookmarked());
  }, [loadNotes, loadSubjects]);

  const handlePress = useCallback(
    (note: Note) => {
      router.push(`/note/${note.id}`);
    },
    [router]
  );

  const handleRemoveBookmark = useCallback(
    (note: Note) => {
      Alert.alert(
        'Remove Bookmark',
        `Remove bookmark from "${note.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              toggleBookmark(note.id);
              refreshList();
            },
          },
        ]
      );
    },
    [toggleBookmark, refreshList]
  );

  const renderItem = useCallback(
    ({ item }: { item: Note }) => (
      <NoteCard
        note={item}
        onPress={() => handlePress(item)}
        subjectName={getSubjectName(item.subjectId)}
      />
    ),
    [handlePress, getSubjectName]
  );

  const keyExtractor = useCallback((item: Note) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Bookmarks"
        showBack
        onBack={() => router.back()}
      />

      {bookmarks.length > 0 && (
        <SectionHeader title={`${bookmarks.length} Bookmarked Note${bookmarks.length !== 1 ? 's' : ''}`} />
      )}

      <FlatList
        data={bookmarks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-off"
            title="No Bookmarked Notes"
            subtitle="Notes you bookmark will appear here"
          />
        }
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Bookmarked notes list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
