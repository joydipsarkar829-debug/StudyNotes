import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { NoteType } from '../types';

interface NoteTypeBadgeProps {
  type: NoteType;
}

const noteTypeConfig: Record<NoteType, { label: string; colorKey: string }> = {
  [NoteType.Normal]: { label: 'Normal', colorKey: 'info' },
  [NoteType.Quick]: { label: 'Quick', colorKey: 'warning' },
  [NoteType.Revision]: { label: 'Revision', colorKey: 'primary' },
  [NoteType.Formula]: { label: 'Formula', colorKey: 'secondary' },
  [NoteType.QA]: { label: 'Q&A', colorKey: 'success' },
  [NoteType.Definition]: { label: 'Definition', colorKey: 'info' },
  [NoteType.ImportantTopic]: { label: 'Important', colorKey: 'error' },
  [NoteType.Assignment]: { label: 'Assignment', colorKey: 'warning' },
  [NoteType.Todo]: { label: 'To-Do', colorKey: 'info' },
  [NoteType.ExamPrep]: { label: 'Exam Prep', colorKey: 'error' },
};

const NoteTypeBadge: React.FC<NoteTypeBadgeProps> = ({ type }) => {
  const theme = useTheme();
  const config = noteTypeConfig[type] || noteTypeConfig[NoteType.Normal];
  const color = (theme.colors as any)[config.colorKey] || theme.colors.info;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color + '18', borderRadius: theme.borderRadius.sm },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {},
});

export default React.memo(NoteTypeBadge);
