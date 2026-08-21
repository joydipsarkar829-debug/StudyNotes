import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import type { Subject } from '../types';
import ProgressBar from './ProgressBar';

interface SubjectCardProps {
  subject: Subject;
  onPress?: () => void;
  chapterCount?: number;
  noteCount?: number;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onPress,
  chapterCount = 0,
  noteCount = 0,
}) => {
  const theme = useTheme();

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: subject.color + '20', borderRadius: theme.borderRadius.md },
          ]}
        >
          <MaterialCommunityIcons
            name={subject.icon as any}
            size={28}
            color={subject.color}
          />
        </View>
        <View style={styles.headerText}>
          <Text
            style={[
              styles.name,
              { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold },
            ]}
            numberOfLines={1}
          >
            {subject.name}
          </Text>
          {subject.description ? (
            <Text
              style={[
                styles.description,
                { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
              ]}
              numberOfLines={1}
            >
              {subject.description}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <MaterialCommunityIcons
            name="book-open-variant"
            size={16}
            color={theme.colors.textMuted}
          />
          <Text
            style={[
              styles.statText,
              { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },
            ]}
          >
            {chapterCount} {chapterCount === 1 ? 'Chapter' : 'Chapters'}
          </Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons
            name="note-text"
            size={16}
            color={theme.colors.textMuted}
          />
          <Text
            style={[
              styles.statText,
              { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },
            ]}
          >
            {noteCount} {noteCount === 1 ? 'Note' : 'Notes'}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar
          progress={chapterCount > 0 ? Math.round((noteCount / chapterCount) * 100) : 0}
          color={subject.color}
          height={6}
          showLabel={false}
        />
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${subject.name}, ${chapterCount} chapters, ${noteCount} notes`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {},
  description: {
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 4,
  },
});

export default React.memo(SubjectCard);
