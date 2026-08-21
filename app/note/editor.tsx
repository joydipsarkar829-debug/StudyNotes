import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/theme';
import { useNoteStore } from '@/store/useNoteStore';
import { useSubjectStore } from '@/store/useSubjectStore';
import { useTagStore } from '@/store/useTagStore';
import { db } from '@/database';
import Header from '@/components/Header';
import TagChip from '@/components/TagChip';
import { NoteType, Note } from '@/types';

const NOTE_TYPE_OPTIONS: { type: NoteType; label: string }[] = [
  { type: NoteType.Normal, label: 'Normal' },
  { type: NoteType.Quick, label: 'Quick Note' },
  { type: NoteType.Revision, label: 'Revision' },
  { type: NoteType.Formula, label: 'Formula Sheet' },
  { type: NoteType.QA, label: 'Q&A' },
  { type: NoteType.Definition, label: 'Definition' },
  { type: NoteType.ImportantTopic, label: 'Important Topic' },
  { type: NoteType.Assignment, label: 'Assignment' },
  { type: NoteType.Todo, label: 'To-Do' },
  { type: NoteType.ExamPrep, label: 'Exam Prep' },
];

const FORMAT_BUTTONS = [
  { key: 'bold', icon: 'format-bold', marker: '**' },
  { key: 'italic', icon: 'format-italic', marker: '*' },
  { key: 'underline', icon: 'format-underline', marker: '__' },
  { key: 'list', icon: 'format-list-bulleted', marker: '- ' },
  { key: 'heading', icon: 'format-header-pound', marker: '# ' },
  { key: 'code', icon: 'code-tags', marker: '`' },
  { key: 'quote', icon: 'format-quote-close', marker: '> ' },
];

export default function NoteEditorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = !!id;

  const { createNote, updateNote, setCurrentNote } = useNoteStore();
  const { subjects, chapters, loadSubjects, loadChapters } = useSubjectStore();
  const { tags, loadTags, createTag } = useTagStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<NoteType>(NoteType.Normal);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(id || null);
  const [hasChanges, setHasChanges] = useState(false);

  const contentRef = useRef<TextInput>(null);
  const cursorPos = useRef({ start: 0, end: 0 });
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredChapters = chapters.filter((c) => c.subjectId === selectedSubjectId);

  useEffect(() => {
    loadSubjects();
    loadTags();
    if (id) {
      const raw = db.getNoteById(id);
      if (raw) {
        setNoteId(raw.id);
        setTitle(raw.title);
        setContent(raw.content);
        setSelectedSubjectId(raw.subject_id);
        setSelectedChapterId(raw.chapter_id);
        setSelectedType(raw.type as NoteType);

        const noteTags = db.getTagsByNote(id).map((t) => t.name);
        setSelectedTagNames(noteTags);

        if (raw.subject_id) {
          loadChapters(raw.subject_id);
        }
      }
    }
  }, [id]);

  useEffect(() => {
    if (selectedSubjectId) {
      loadChapters(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!hasChanges) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [title, content, selectedSubjectId, selectedChapterId, selectedType]);

  const handleAutoSave = useCallback(() => {
    if (!title.trim() && !content.trim()) return;

    if (noteId) {
      const updated = updateNote(noteId, {
        title: title.trim() || 'Untitled',
        content,
        type: selectedType,
        subjectId: selectedSubjectId || undefined,
        chapterId: selectedChapterId || undefined,
      });
      if (updated) {
        syncTags(noteId);
      }
    } else {
      const newNote = createNote({
        title: title.trim() || 'Untitled',
        content,
        type: selectedType,
        subjectId: selectedSubjectId || undefined,
        chapterId: selectedChapterId || undefined,
      });
      if (newNote) {
        setNoteId(newNote.id);
        syncTags(newNote.id);
      }
    }
  }, [
    title,
    content,
    selectedType,
    selectedSubjectId,
    selectedChapterId,
    noteId,
    createNote,
    updateNote,
    selectedTagNames,
  ]);

  const syncTags = useCallback(
    (nId: string) => {
      const currentDbTags = db.getTagsByNote(nId).map((t) => t.name);
      const newTagNames = selectedTagNames;

      currentDbTags.forEach((tagName) => {
        if (!newTagNames.includes(tagName)) {
          const existingTag = tags.find((t) => t.name === tagName);
          if (existingTag) {
            db.removeTagFromNote(nId, existingTag.id);
          }
        }
      });

      newTagNames.forEach((tagName) => {
        if (!currentDbTags.includes(tagName)) {
          let tag = tags.find((t) => t.name === tagName);
          if (!tag) {
            const created = createTag({ name: tagName });
            if (created) tag = created;
          }
          if (tag) {
            db.addTagToNote(nId, tag.id);
          }
        }
      });
    },
    [selectedTagNames, tags, createTag]
  );

  const handleSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a note title.');
      return;
    }

    if (noteId) {
      const updated = updateNote(noteId, {
        title: title.trim(),
        content,
        type: selectedType,
        subjectId: selectedSubjectId || undefined,
        chapterId: selectedChapterId || undefined,
      });
      if (updated) {
        syncTags(noteId);
        setCurrentNote(updated);
      }
    } else {
      const newNote = createNote({
        title: title.trim(),
        content,
        type: selectedType,
        subjectId: selectedSubjectId || undefined,
        chapterId: selectedChapterId || undefined,
      });
      if (newNote) {
        syncTags(newNote.id);
        setNoteId(newNote.id);
      }
    }

    router.back();
  }, [
    title,
    content,
    selectedType,
    selectedSubjectId,
    selectedChapterId,
    noteId,
    createNote,
    updateNote,
    setCurrentNote,
    syncTags,
    router,
  ]);

  const handleClose = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    if (hasChanges && title.trim()) {
      Alert.alert('Discard Changes', 'You have unsaved changes. Discard them?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [hasChanges, title, router]);

  const handleTitleChange = useCallback((text: string) => {
    setTitle(text);
    setHasChanges(true);
  }, []);

  const handleContentChange = useCallback((text: string) => {
    setContent(text);
    setHasChanges(true);
  }, []);

  const handleSelectionChange = useCallback(
    (event: any) => {
      if (event.nativeEvent.selection) {
        cursorPos.current = event.nativeEvent.selection;
      }
    },
    []
  );

  const handleFormat = useCallback(
    (marker: string) => {
      const currentContent = content;
      const pos = cursorPos.current.start;
      const newContent =
        currentContent.slice(0, pos) + marker + currentContent.slice(pos);
      setContent(newContent);
      setHasChanges(true);

      setTimeout(() => {
        if (contentRef.current) {
          const newPos = pos + marker.length;
          contentRef.current.setNativeProps({
            selection: { start: newPos, end: newPos },
          });
        }
      }, 10);
    },
    [content]
  );

  const handleAddTag = useCallback(() => {
    const tagName = tagInput.trim();
    if (!tagName) return;
    if (selectedTagNames.includes(tagName)) {
      setTagInput('');
      return;
    }
    setSelectedTagNames((prev) => [...prev, tagName]);
    setTagInput('');
    setHasChanges(true);
  }, [tagInput, selectedTagNames]);

  const handleRemoveTag = useCallback((tagName: string) => {
    setSelectedTagNames((prev) => prev.filter((t) => t !== tagName));
    setHasChanges(true);
  }, []);

  const handleSelectSubject = useCallback((subjectId: string) => {
    setSelectedSubjectId((prev) => {
      if (prev === subjectId) return null;
      return subjectId;
    });
    setSelectedChapterId(null);
    setHasChanges(true);
  }, []);

  const handleSelectChapter = useCallback((chapterId: string) => {
    setSelectedChapterId((prev) => {
      if (prev === chapterId) return null;
      return chapterId;
    });
    setHasChanges(true);
  }, []);

  const handleSelectType = useCallback((type: NoteType) => {
    setSelectedType(type);
    setShowTypePicker(false);
    setHasChanges(true);
  }, []);

  const selectedTypeLabel =
    NOTE_TYPE_OPTIONS.find((o) => o.type === selectedType)?.label || 'Normal';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={isEditing ? 'Edit Note' : 'New Note'}
        showBack
        onBack={handleClose}
        rightIcon="content-save"
        onRightPress={handleSave}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={[
              styles.titleInput,
              {
                color: theme.colors.text,
                fontSize: theme.fontSize.xxl,
                fontWeight: theme.fontWeight.bold as any,
              },
            ]}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Note title"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            blurOnSubmit
            accessibilityLabel="Note title"
          />

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold as any },
              ]}
            >
              Subject
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.pickerChip,
                    {
                      backgroundColor:
                        selectedSubjectId === subject.id
                          ? subject.color
                          : theme.colors.surfaceVariant,
                      borderRadius: theme.borderRadius.full,
                      borderWidth: 1,
                      borderColor:
                        selectedSubjectId === subject.id
                          ? subject.color
                          : theme.colors.border,
                    },
                  ]}
                  onPress={() => handleSelectSubject(subject.id)}
                  accessibilityLabel={`Select ${subject.name}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedSubjectId === subject.id }}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      {
                        color: selectedSubjectId === subject.id ? '#FFFFFF' : theme.colors.text,
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.fontWeight.medium as any,
                      },
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedSubjectId && filteredChapters.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold as any },
                ]}
              >
                Chapter
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                {filteredChapters.map((chapter) => (
                  <TouchableOpacity
                    key={chapter.id}
                    style={[
                      styles.pickerChip,
                      {
                        backgroundColor:
                          selectedChapterId === chapter.id
                            ? theme.colors.secondary
                            : theme.colors.surfaceVariant,
                        borderRadius: theme.borderRadius.full,
                        borderWidth: 1,
                        borderColor:
                          selectedChapterId === chapter.id
                            ? theme.colors.secondary
                            : theme.colors.border,
                      },
                    ]}
                    onPress={() => handleSelectChapter(chapter.id)}
                    accessibilityLabel={`Select ${chapter.title}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedChapterId === chapter.id }}
                  >
                    <Text
                      style={[
                        styles.pickerChipText,
                        {
                          color: selectedChapterId === chapter.id ? '#FFFFFF' : theme.colors.text,
                          fontSize: theme.fontSize.sm,
                          fontWeight: theme.fontWeight.medium as any,
                        },
                      ]}
                    >
                      {chapter.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold as any },
              ]}
            >
              Note Type
            </Text>
            <TouchableOpacity
              style={[
                styles.typeSelector,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setShowTypePicker(!showTypePicker)}
              accessibilityLabel={`Note type: ${selectedTypeLabel}`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.typeSelectorText,
                  { color: theme.colors.text, fontSize: theme.fontSize.md },
                ]}
              >
                {selectedTypeLabel}
              </Text>
              <MaterialCommunityIcons
                name={showTypePicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            {showTypePicker && (
              <View
                style={[
                  styles.typeDropdown,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {NOTE_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor:
                          selectedType === option.type
                            ? theme.colors.primaryLight
                            : 'transparent',
                        borderRadius: theme.borderRadius.sm,
                      },
                    ]}
                    onPress={() => handleSelectType(option.type)}
                    accessibilityLabel={`Select ${option.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedType === option.type }}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        {
                          color:
                            selectedType === option.type
                              ? theme.colors.primary
                              : theme.colors.text,
                          fontSize: theme.fontSize.md,
                          fontWeight: (selectedType === option.type
                              ? theme.fontWeight.semibold
                              : theme.fontWeight.normal) as any,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedType === option.type && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold as any },
              ]}
            >
              Tags
            </Text>
            {selectedTagNames.length > 0 && (
              <View style={styles.tagsRow}>
                {selectedTagNames.map((tag) => (
                  <TagChip
                    key={tag}
                    name={tag}
                    onRemove={() => handleRemoveTag(tag)}
                  />
                ))}
              </View>
            )}
            <View style={styles.tagInputRow}>
              <TextInput
                style={[
                  styles.tagInput,
                  {
                    color: theme.colors.text,
                    fontSize: theme.fontSize.md,
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag..."
                placeholderTextColor={theme.colors.textMuted}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
                accessibilityLabel="Add tag"
              />
              <TouchableOpacity
                style={[
                  styles.tagAddButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                onPress={handleAddTag}
                accessibilityLabel="Add tag"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            ref={contentRef}
            style={[
              styles.contentInput,
              {
                color: theme.colors.text,
                fontSize: theme.fontSize.md,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
              },
            ]}
            value={content}
            onChangeText={handleContentChange}
            onSelectionChange={handleSelectionChange}
            placeholder="Start writing your note..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Note content"
          />
        </ScrollView>

        <View
          style={[
            styles.toolbar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarScroll}
          >
            {FORMAT_BUTTONS.map((btn) => (
              <TouchableOpacity
                key={btn.key}
                style={[
                  styles.toolbarButton,
                  {
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}
                onPress={() => handleFormat(btn.marker)}
                accessibilityLabel={`Format ${btn.key}`}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name={btn.icon as any}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  titleInput: {
    padding: 0,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  chipScroll: {
    gap: 8,
  },
  pickerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  pickerChipText: {},
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typeSelectorText: {},
  typeDropdown: {
    marginTop: 4,
    padding: 4,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 2,
  },
  typeOptionText: {},
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tagAddButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInput: {
    minHeight: 250,
    padding: 16,
    marginTop: 4,
  },
  toolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  toolbarScroll: {
    paddingHorizontal: 12,
    gap: 4,
  },
  toolbarButton: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
