export const APP_NAME = 'Study Notes';
export const APP_VERSION = '1.0.0';
export const CREATED_BY = 'Joydip Sarkar';
export const COPYRIGHT = '© 2026 Created by Joydip Sarkar';

export const DEFAULT_SUBJECTS = [
  {
    name: 'Mathematics',
    icon: 'calculator-variant',
    color: '#4A90D9',
  },
  {
    name: 'Physics',
    icon: 'atom',
    color: '#7B68EE',
  },
  {
    name: 'Chemistry',
    icon: 'flask-outline',
    color: '#2ECC71',
  },
  {
    name: 'Biology',
    icon: 'leaf',
    color: '#27AE60',
  },
  {
    name: 'English',
    icon: 'book-open-variant',
    color: '#E74C3C',
  },
  {
    name: 'Bengali',
    icon: 'translate',
    color: '#F39C12',
  },
  {
    name: 'Computer Science',
    icon: 'laptop',
    color: '#9B59B6',
  },
  {
    name: 'History',
    icon: 'clock-outline',
    color: '#E67E22',
  },
];

export const NOTE_TYPES = [
  { type: 'normal', label: 'Normal Note', color: '#4A90D9' },
  { type: 'quick', label: 'Quick Note', color: '#2ECC71' },
  { type: 'revision', label: 'Revision Note', color: '#E74C3C' },
  { type: 'formula', label: 'Formula Sheet', color: '#9B59B6' },
  { type: 'qa', label: 'Q&A', color: '#F39C12' },
  { type: 'definition', label: 'Definition', color: '#1ABC9C' },
  { type: 'important_topic', label: 'Important Topic', color: '#E67E22' },
  { type: 'assignment', label: 'Assignment', color: '#3498DB' },
  { type: 'todo', label: 'To-Do', color: '#95A5A6' },
  { type: 'exam_prep', label: 'Exam Prep', color: '#C0392B' },
];

export const SUBJECT_COLORS = [
  '#4A90D9',
  '#7B68EE',
  '#2ECC71',
  '#E74C3C',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#3498DB',
  '#2C3E50',
];

export const SUBJECT_ICONS = [
  'calculator-variant',
  'atom',
  'flask-outline',
  'leaf',
  'book-open-variant',
  'translate',
  'laptop',
  'clock-outline',
  'music-note',
  'palette',
  'brain',
  'earth',
  'chart-line',
  'camera',
  'dumbbell',
  'food-apple-outline',
  'car',
  'lightbulb-on',
  'finance',
  'silverware-fork-knife',
];

export const TIMER_PRESETS = {
  pomodoro: {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
  },
};

export const FONT_SIZES = [
  { label: 'Small', value: 'small', size: 13 },
  { label: 'Medium', value: 'medium', size: 16 },
  { label: 'Large', value: 'large', size: 19 },
];

export const ACCENT_COLORS = [
  '#4A90D9',
  '#7B68EE',
  '#2ECC71',
  '#E74C3C',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
];

export const SAMPLE_DATA = {
  notes: [
    {
      title: 'Quadratic Equations',
      content: 'A quadratic equation is of the form ax² + bx + c = 0, where a ≠ 0.\n\nSolutions: x = (-b ± √(b²-4ac)) / 2a\n\nDiscriminant: D = b²-4ac\n- D > 0: Two distinct real roots\n- D = 0: One repeated root\n- D < 0: No real roots',
      type: 'formula',
      tags: ['algebra', 'quadratic', 'formulas'],
      subjectName: 'Mathematics',
    },
    {
      title: "Newton's Laws of Motion",
      content: "First Law: A body remains at rest or in uniform motion unless acted upon by an external force.\n\nSecond Law: F = ma (Force equals mass times acceleration)\n\nThird Law: For every action, there is an equal and opposite reaction.",
      type: 'normal',
      tags: ['mechanics', 'newton', 'laws'],
      subjectName: 'Physics',
    },
    {
      title: 'Periodic Table Trends',
      content: 'Electronegativity increases across a period and decreases down a group.\n\nAtomic radius decreases across a period and increases down a group.\n\nIonization energy increases across a period and decreases down a group.',
      type: 'revision',
      tags: ['periodic-table', 'trends', 'chemistry'],
      subjectName: 'Chemistry',
    },
    {
      title: 'Cell Structure',
      content: 'Prokaryotic cells: No membrane-bound nucleus (e.g., bacteria)\n\nEukaryotic cells: Membrane-bound nucleus and organelles\n- Nucleus, Mitochondria, ER, Golgi apparatus, Lysosomes, Ribosomes',
      type: 'definition',
      tags: ['cell-biology', 'structure'],
      subjectName: 'Biology',
    },
  ],
  flashcards: [
    {
      question: 'What is the SI unit of force?',
      answer: 'Newton (N)',
      subjectName: 'Physics',
    },
    {
      question: 'What is the value of sin 90°?',
      answer: '1',
      subjectName: 'Mathematics',
    },
    {
      question: 'What is the chemical formula for table salt?',
      answer: 'NaCl (Sodium Chloride)',
      subjectName: 'Chemistry',
    },
  ],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 999,
};
