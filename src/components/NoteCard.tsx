import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import type { Note } from '../types';
import NoteTypeBadge from './NoteTypeBadge';
import TagChip from './TagChip';

interface NoteCardProps {
  note: Note;
  onPress?: () => void;
  subjectName?: string;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPress,
  subjectName,
}) => {
  const theme = useTheme();

  const indicators: string[] = [];
  if (note.isPinned) indicators.push('pin');
  if (note.isFavorite) indicators.push('heart');
  if (note.isBookmarked) indicators.push('bookmark');

  const indicatorColors: Record<string, string> = {
    pin: theme.colors.warning,
    heart: theme.colors.error,
    bookmark: theme.colors.info,
  };

  const indicatorIcons: Record<string, string> = {
    pin: 'pin',
    heart: 'heart',
    bookmark: 'bookmark',
  };

  const formattedDate = new Date(note.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {indicators.length > 0 && (
            <View style={styles.indicators}>
              {indicators.map((ind) => (
                <MaterialCommunityIcons
                  key={ind}
                  name={indicatorIcons[ind] as any}
                  size={14}
                  color={indicatorColors[ind]}
                  style={styles.indicator}
                />
              ))}
            </View>
          )}
        </View>
        <NoteTypeBadge type={note.type} />
      </View>

      <Text
        style={[
          styles.title,
          { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold },
        ]}
        numberOfLines={2}
      >
        {note.title}
      </Text>

      <Text
        style={[
          styles.excerpt,
          { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
        ]}
        numberOfLines={2}
      >
        {note.content}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {subjectName && (
            <Text
              style={[
                styles.subjectName,
                { color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium },
              ]}
              numberOfLines={1}
            >
              {subjectName}
            </Text>
          )}
          <Text
            style={[
              styles.date,
              { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
            ]}
          >
            {formattedDate}
          </Text>
        </View>
      </View>

      {note.tags.length > 0 && (
        <View style={styles.tags}>
          {note.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag} name={tag} />
          ))}
          {note.tags.length > 3 && (
            <Text
              style={[
                styles.moreTags,
                { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
              ]}
            >
              +{note.tags.length - 3}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Note: ${note.title}`}
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
    marginHorizontal: 16,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    marginRight: 4,
  },
  title: {
    marginBottom: 4,
  },
  excerpt: {
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectName: {
    marginRight: 8,
  },
  date: {},
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  moreTags: {
    marginLeft: 4,
  },
});

export default React.memo(NoteCard);
