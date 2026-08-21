export enum NoteType {
  Normal = 'normal',
  Quick = 'quick',
  Revision = 'revision',
  Formula = 'formula',
  QA = 'qa',
  Definition = 'definition',
  ImportantTopic = 'important_topic',
  Assignment = 'assignment',
  Todo = 'todo',
  ExamPrep = 'exam_prep',
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  defaultSubject: string | null;
  autoSave: boolean;
  defaultNoteType: NoteType;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  progress: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  subjectId: string;
  chapterId: string | null;
  title: string;
  content: string;
  type: NoteType;
  tags: string[];
  isFavorite: boolean;
  isBookmarked: boolean;
  isPinned: boolean;
  isImportant: boolean;
  isArchived: boolean;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  noteId: string;
  type: 'image' | 'file' | 'audio' | 'video';
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  chapterId: string | null;
  question: string;
  answer: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  nextReview: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  subjectId: string;
  chapterId: string | null;
  title: string;
  type: 'mcq' | 'true_false' | 'fill_blank' | 'mixed';
  questions: QuizQuestion[];
  score: number | null;
  totalQuestions: number;
  createdAt: string;
  completedAt: string | null;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  type: 'mcq' | 'true_false' | 'fill_blank';
  explanation: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  duration: number;
  startedAt: string;
  endedAt: string | null;
  type: 'study' | 'revision' | 'flashcard' | 'quiz' | 'pomodoro';
}

export interface Reminder {
  id: string;
  title: string;
  subjectId: string | null;
  chapterId: string | null;
  date: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  type: 'study' | 'revision' | 'assignment' | 'exam' | 'custom';
  isCompleted: boolean;
  createdAt: string;
}

export interface Exam {
  id: string;
  subjectId: string;
  name: string;
  examDate: string;
  syllabus: string;
  importantChapters: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RevisionHistory {
  id: string;
  noteId: string;
  reviewedAt: string;
  revised: boolean;
}

export interface SearchResult {
  id: string;
  type: 'note' | 'flashcard' | 'quiz' | 'subject' | 'chapter';
  title: string;
  subtitle: string;
  subjectId: string | null;
  isHighlighted: boolean;
}

export interface DatabaseStats {
  totalNotes: number;
  totalSubjects: number;
  totalChapters: number;
  totalFlashcards: number;
  totalQuizzes: number;
  totalStudySessions: number;
  totalReminders: number;
  totalExams: number;
  totalTags: number;
  storageUsed: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  defaultSubject: string | null;
  autoSave: boolean;
  defaultNoteType: NoteType;
  pomodoroWorkDuration: number;
  pomodoroBreakDuration: number;
  pomodoroLongBreakDuration: number;
  flashcardsPerSession: number;
  notificationsEnabled: boolean;
  pinLockEnabled: boolean;
  fingerprintEnabled: boolean;
  exportFormat: 'pdf' | 'json' | 'txt';
  language: string;
  accentColor: string;
}
