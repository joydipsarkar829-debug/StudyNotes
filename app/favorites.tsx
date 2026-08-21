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

export default function FavoritesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { loadFavorites, toggleFavorite, loadNotes } = useNoteStore();
  const { subjects, loadSubjects } = useSubjectStore();

  const [favorites, setFavorites] = useState<Note[]>(() => {
    loadSubjects();
    const raw = loadFavorites();
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
    setFavorites(loadFavorites());
  }, [loadNotes, loadSubjects]);

  const handlePress = useCallback(
    (note: Note) => {
      router.push(`/note/${note.id}`);
    },
    [router]
  );

  const handleRemoveFavorite = useCallback(
    (note: Note) => {
      Alert.alert(
        'Remove from Favorites',
        `Remove "${note.title}" from favorites?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              toggleFavorite(note.id);
              refreshList();
            },
          },
        ]
      );
    },
    [toggleFavorite, refreshList]
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
        title="Favorites"
        showBack
        onBack={() => router.back()}
      />

      {favorites.length > 0 && (
        <SectionHeader title={`${favorites.length} Favorite Note${favorites.length !== 1 ? 's' : ''}`} />
      )}

      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="heart-off"
            title="No Favorite Notes"
            subtitle="Notes you mark as favorites will appear here"
          />
        }
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Favorite notes list"
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
