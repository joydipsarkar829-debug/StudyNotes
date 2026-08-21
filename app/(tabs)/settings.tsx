import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store';
import Header from '@/components/Header';
import MenuItem from '@/components/MenuItem';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { db } from '@/database';
import { APP_NAME, APP_VERSION, CREATED_BY, COPYRIGHT, ACCENT_COLORS, FONT_SIZES, NOTE_TYPES } from '@/constants';

export default function SettingsScreen() {
  const theme = useTheme();
  const {
    theme: appTheme,
    accentColor,
    fontSize,
    setTheme,
    setAccentColor,
    setFontSize,
  } = useAppStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [studyReminders, setStudyReminders] = useState(false);
  const [revisionReminders, setRevisionReminders] = useState(false);

  const handleBackup = useCallback(async () => {
    try {
      const subjects = db.getAllSubjects();
      const chapters: any[] = [];
      subjects.forEach((s) => {
        db.getChaptersBySubject(s.id).forEach((c) => chapters.push(c));
      });
      const notes = db.getAllNotes();
      const tags = db.getAllTags();
      const flashcards = db.getAllFlashcards();
      const quizzes = db.getAllQuizzes();
      const sessions = db.getAllStudySessions();
      const reminders = db.getAllReminders();
      const exams = db.getAllExams();

      const backup = {
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        data: { subjects, chapters, notes, tags, flashcards, quizzes, sessions, reminders, exams },
      };

      const json = JSON.stringify(backup, null, 2);
      const fileName = `study-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json);
      await Sharing.shareAsync(fileUri, { mimeType: 'application/json' });
    } catch {
      Alert.alert('Error', 'Failed to create backup. Please try again.');
    }
  }, []);

  const handleRestore = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled || !result.assets?.[0]) return;
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const parsed = JSON.parse(content);
      if (!parsed?.data?.subjects) {
        Alert.alert('Invalid Backup', 'This file does not appear to be a valid Study Notes backup.');
        return;
      }
      Alert.alert(
        'Restore Backup',
        'This will replace all existing data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => {
              try {
                const d = parsed.data;
                if (d.subjects) d.subjects.forEach((s: any) => db.updateSubject(s.id, { name: s.name, description: s.description, icon: s.icon, color: s.color }));
                if (d.notes) d.notes.forEach((n: any) => db.createNote({ subject_id: n.subject_id, chapter_id: n.chapter_id, title: n.title, content: n.content, type: n.type }));
                Alert.alert('Success', 'Backup restored successfully!');
              } catch {
                Alert.alert('Error', 'Failed to restore backup.');
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Unable to import this backup.');
    }
  }, []);

  const handleClearData = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const confirmClear = useCallback(() => {
    try {
      db.getAllNotes().forEach((n) => db.deleteNote(n.id));
      db.getAllSubjects().forEach((s) => db.deleteSubject(s.id));
      db.getAllTags().forEach((t) => db.deleteTag(t.id));
      db.getAllFlashcards().forEach((f) => db.deleteFlashcard(f.id));
      db.getAllQuizzes().forEach((q) => db.deleteQuiz(q.id));
      setShowClearConfirm(false);
      Alert.alert('Cleared', 'All data has been removed.');
    } catch {
      Alert.alert('Error', 'Failed to clear data.');
    }
  }, []);

  const themeOptions: Array<{ label: string; value: 'light' | 'dark' | 'system'; icon: string }> = [
    { label: 'Light', value: 'light', icon: 'weather-sunny' },
    { label: 'Dark', value: 'dark', icon: 'weather-night' },
    { label: 'System', value: 'system', icon: 'cellphone' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Settings" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Theme</Text>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: appTheme === opt.value ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderColor: appTheme === opt.value ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setTheme(opt.value)}
                accessibilityLabel={`Set theme to ${opt.label}`}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name={opt.icon as any}
                  size={20}
                  color={appTheme === opt.value ? '#FFFFFF' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeLabel,
                    { color: appTheme === opt.value ? '#FFFFFF' : theme.colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.text, marginTop: 16 }]}>Accent Color</Text>
          <View style={styles.colorGrid}>
            {ACCENT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  accentColor === color && styles.colorSelected,
                  accentColor === color && { borderColor: theme.colors.text },
                ]}
                onPress={() => setAccentColor(color)}
                accessibilityLabel={`Set accent color`}
                accessibilityRole="button"
              />
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.text, marginTop: 16 }]}>Font Size</Text>
          <View style={styles.fontSizeRow}>
            {FONT_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.fontSizeOption,
                  {
                    backgroundColor: fontSize === size ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderColor: fontSize === size ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setFontSize(size)}
                accessibilityLabel={`Set font size to ${size}`}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    color: fontSize === size ? '#FFFFFF' : theme.colors.text,
                    fontSize: 13,
                    fontWeight: fontSize === size ? '700' : '400',
                  }}
                >
                  {size < 16 ? 'A' : size < 18 ? 'A' : 'A'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>NOTES</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MenuItem icon="file-document-edit" title="Default Note Type" subtitle="Normal" onPress={() => setShowTypePicker(true)} />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Auto-save</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Save drafts automatically</Text>
            </View>
            <Switch
              value={autoSave}
              onValueChange={setAutoSave}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primaryLight }}
              thumbColor={autoSave ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Study Reminders</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Get reminded to study</Text>
            </View>
            <Switch
              value={studyReminders}
              onValueChange={setStudyReminders}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primaryLight }}
              thumbColor={studyReminders ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Revision Reminders</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Get reminded to revise</Text>
            </View>
            <Switch
              value={revisionReminders}
              onValueChange={setRevisionReminders}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primaryLight }}
              thumbColor={revisionReminders ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>DATA MANAGEMENT</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MenuItem icon="cloud-upload" title="Backup Data" subtitle="Export all notes as JSON" onPress={handleBackup} />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <MenuItem icon="cloud-download" title="Restore Backup" subtitle="Import from JSON file" onPress={handleRestore} />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <MenuItem icon="delete-forever" title="Clear All Data" subtitle="Remove everything" color={theme.colors.error} onPress={handleClearData} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.aboutHeader}>
            <MaterialCommunityIcons name="book-open-variant" size={48} color={theme.colors.primary} />
            <Text style={[styles.aboutTitle, { color: theme.colors.text }]}>{APP_NAME}</Text>
            <Text style={[styles.aboutVersion, { color: theme.colors.textMuted }]}>Version {APP_VERSION}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.aboutCreator, { color: theme.colors.textSecondary }]}>{CREATED_BY}</Text>
          <Text style={[styles.aboutCopyright, { color: theme.colors.textMuted }]}>{COPYRIGHT}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmDialog
        visible={showClearConfirm}
        title="Clear All Data"
        message="This will permanently delete all your notes, subjects, and other data. This action cannot be undone."
        confirmText="Clear Everything"
        cancelText="Cancel"
        onConfirm={confirmClear}
        onCancel={() => setShowClearConfirm(false)}
        variant="danger"
      />

      <Modal visible={showTypePicker} onClose={() => setShowTypePicker(false)} title="Default Note Type">
        {NOTE_TYPES.map((nt) => (
          <TouchableOpacity
            key={nt.value}
            style={[styles.typeOption, { borderBottomColor: theme.colors.border }]}
            onPress={() => {
              db.setSetting('defaultNoteType', nt.value);
              setShowTypePicker(false);
            }}
          >
            <MaterialCommunityIcons name={nt.icon as any} size={20} color={nt.color} />
            <Text style={[styles.typeLabel, { color: theme.colors.text }]}>{nt.label}</Text>
          </TouchableOpacity>
        ))}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 8, letterSpacing: 0.5 },
  card: { borderRadius: 12, padding: 16, borderWidth: 1 },
  label: { fontSize: 15, fontWeight: '500' },
  subtitle: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  themeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  themeOption: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  themeLabel: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorSelected: { borderWidth: 3, transform: [{ scale: 1.1 }] },
  fontSizeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  fontSizeOption: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchInfo: { flex: 1 },
  aboutHeader: { alignItems: 'center', paddingVertical: 16 },
  aboutTitle: { fontSize: 20, fontWeight: '700', marginTop: 10 },
  aboutVersion: { fontSize: 14, marginTop: 4 },
  aboutCreator: { textAlign: 'center', fontSize: 15, fontWeight: '500', marginTop: 4 },
  aboutCopyright: { textAlign: 'center', fontSize: 13, marginTop: 4 },
  typeOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, gap: 12 },
  typeLabel: { fontSize: 15 },
});
