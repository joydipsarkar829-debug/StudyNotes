export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSubjectName(name: string): ValidationResult {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Subject name is required' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Subject name must be 100 characters or less' };
  }
  return { valid: true };
}

export function validateChapterTitle(title: string): ValidationResult {
  if (typeof title !== 'string') {
    return { valid: false, error: 'Title must be a string' };
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Chapter title is required' };
  }
  if (trimmed.length > 200) {
    return { valid: false, error: 'Chapter title must be 200 characters or less' };
  }
  return { valid: true };
}

export function validateNoteTitle(title: string): ValidationResult {
  if (typeof title !== 'string') {
    return { valid: false, error: 'Title must be a string' };
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Note title is required' };
  }
  if (trimmed.length > 200) {
    return { valid: false, error: 'Note title must be 200 characters or less' };
  }
  return { valid: true };
}

export function validateTagName(name: string): ValidationResult {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Tag name must be a string' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Tag name is required' };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'Tag name must be 50 characters or less' };
  }
  return { valid: true };
}

export function validateBackupData(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Backup data must be an object' };
  }
  if (!data.metadata || typeof data.metadata !== 'object') {
    return { valid: false, error: 'Missing or invalid metadata' };
  }
  if (typeof data.metadata.appName !== 'string') {
    return { valid: false, error: 'Invalid appName in metadata' };
  }
  if (typeof data.metadata.exportedAt !== 'string') {
    return { valid: false, error: 'Invalid exportedAt in metadata' };
  }
  if (!data.data || typeof data.data !== 'object') {
    return { valid: false, error: 'Missing or invalid data field' };
  }
  const knownKeys = ['notes', 'subjects', 'chapters', 'flashcards', 'quizzes', 'tags', 'reminders', 'exams'];
  for (const key of Object.keys(data.data)) {
    if (!knownKeys.includes(key)) {
      return { valid: false, error: `Unknown data key: ${key}` };
    }
    if (!Array.isArray(data.data[key])) {
      return { valid: false, error: `${key} must be an array` };
    }
  }
  return { valid: true };
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
