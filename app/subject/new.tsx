import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/store/useSubjectStore';
import { db } from '@/database';
import Header from '@/components/Header';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '@/constants';

export default function NewSubjectScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(SUBJECT_ICONS[0]);
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      const raw = db.getSubjectById(id);
      if (raw) {
        setName(raw.name);
        setDescription(raw.description);
        setSelectedColor(raw.color);
        setSelectedIcon(raw.icon);
      }
    }
  }, [id, isEditing]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      setNameError('Subject name is required');
      return;
    }
    setNameError('');
    setLoading(true);

    setTimeout(() => {
      if (isEditing && id) {
        const updated = useSubjectStore.getState().updateSubject(id, {
          name: name.trim(),
          description: description.trim(),
          color: selectedColor,
          icon: selectedIcon,
        });
        setLoading(false);
        if (updated) {
          router.back();
        } else {
          Alert.alert('Error', 'Failed to update subject');
        }
      } else {
        const created = useSubjectStore.getState().createSubject({
          name: name.trim(),
          description: description.trim(),
          color: selectedColor,
          icon: selectedIcon,
        });
        setLoading(false);
        if (created) {
          router.replace(`/subject/${created.id}` as any);
        } else {
          Alert.alert('Error', 'Failed to create subject');
        }
      }
    }, 100);
  }, [name, description, selectedColor, selectedIcon, isEditing, id, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={isEditing ? 'Edit Subject' : 'New Subject'}
        showBack
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.previewSection}>
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: selectedColor + '15',
                  borderColor: selectedColor,
                },
              ]}
            >
              <View
                style={[
                  styles.previewIcon,
                  { backgroundColor: selectedColor + '30' },
                ]}
              >
                <MaterialCommunityIcons
                  name={selectedIcon as any}
                  size={32}
                  color={selectedColor}
                />
              </View>
              <Text
                style={[
                  styles.previewName,
                  { color: theme.colors.text, fontSize: theme.fontSize.lg },
                ]}
                numberOfLines={1}
              >
                {name || 'Subject Name'}
              </Text>
              {description ? (
                <Text
                  style={[
                    styles.previewDesc,
                    { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
                  ]}
                  numberOfLines={2}
                >
                  {description}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.formSection}>
            <Input
              label="Subject Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError('');
              }}
              placeholder="e.g., Mathematics"
              leftIcon="book-open-variant"
              error={nameError}
            />

            <Input
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of this subject..."
              leftIcon="text-short"
              multiline
              style={styles.descInput}
            />
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, fontSize: theme.fontSize.lg },
              ]}
            >
              Color
            </Text>
            <View style={styles.colorGrid}>
              {SUBJECT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: color,
                      borderColor:
                        selectedColor === color ? theme.colors.text : 'transparent',
                      borderWidth: selectedColor === color ? 3 : 0,
                    },
                  ]}
                  onPress={() => setSelectedColor(color)}
                  accessibilityLabel={`Select color ${color}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedColor === color }}
                >
                  {selectedColor === color && (
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, fontSize: theme.fontSize.lg },
              ]}
            >
              Icon
            </Text>
            <View style={styles.iconGrid}>
              {SUBJECT_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor:
                        selectedIcon === icon
                          ? selectedColor + '20'
                          : theme.colors.surfaceVariant,
                      borderColor:
                        selectedIcon === icon ? selectedColor : 'transparent',
                      borderWidth: selectedIcon === icon ? 2 : 0,
                    },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                  accessibilityLabel={`Select icon ${icon}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedIcon === icon }}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={24}
                    color={
                      selectedIcon === icon ? selectedColor : theme.colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          size="md"
          style={styles.bottomButton}
        />
        <Button
          title={isEditing ? 'Update' : 'Create'}
          onPress={handleSave}
          variant="primary"
          size="md"
          loading={loading}
          icon={isEditing ? 'check' : 'plus'}
          style={styles.bottomButton}
        />
      </View>
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
    paddingBottom: 100,
  },
  previewSection: {
    padding: 16,
  },
  previewCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  previewDesc: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    paddingHorizontal: 16,
  },
  descInput: {
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 14,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  bottomButton: {
    flex: 1,
  },
});
