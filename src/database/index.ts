import * as SQLite from 'expo-sqlite';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

interface UserSetting {
  key: string;
  value: string;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_archived: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  is_completed: number;
  progress: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  subject_id: string | null;
  chapter_id: string | null;
  title: string;
  content: string;
  type: string;
  is_favorite: number;
  is_bookmarked: number;
  is_pinned: number;
  is_important: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface Attachment {
  id: string;
  note_id: string;
  type: string;
  uri: string;
  name: string;
  size: number;
  mime_type: string;
  created_at: string;
}

interface Flashcard {
  id: string;
  subject_id: string | null;
  chapter_id: string | null;
  question: string;
  answer: string;
  difficulty: string;
  next_review: string | null;
  review_count: number;
  created_at: string;
  updated_at: string;
}

interface Quiz {
  id: string;
  subject_id: string | null;
  chapter_id: string | null;
  title: string;
  type: string;
  score: number;
  total_questions: number;
  created_at: string;
  completed_at: string | null;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string;
  correct_answer: string;
  type: string;
  explanation: string;
}

interface StudySession {
  id: string;
  subject_id: string | null;
  duration: number;
  started_at: string;
  ended_at: string | null;
  type: string;
}

interface Reminder {
  id: string;
  title: string;
  subject_id: string | null;
  chapter_id: string | null;
  date: string;
  time: string;
  repeat_type: string;
  reminder_type: string;
  is_completed: number;
  created_at: string;
}

interface Exam {
  id: string;
  subject_id: string | null;
  name: string;
  exam_date: string;
  syllabus: string;
  important_chapters: string;
  created_at: string;
  updated_at: string;
}

interface RevisionHistory {
  id: string;
  note_id: string;
  reviewed_at: string;
  revised: number;
}

class DatabaseManager {
  private db!: SQLite.SQLiteDatabase;

  init(): void {
    this.db = SQLite.openDatabaseSync('studynotes');
    this.db.execSync('PRAGMA journal_mode = WAL;');
    this.db.execSync('PRAGMA foreign_keys = ON;');
    this.createTables();
  }

  private createTables(): void {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        icon TEXT DEFAULT 'book-open-variant',
        color TEXT DEFAULT '#4A90D9',
        is_archived INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        is_completed INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        subject_id TEXT,
        chapter_id TEXT,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        type TEXT DEFAULT 'normal',
        is_favorite INTEGER DEFAULT 0,
        is_bookmarked INTEGER DEFAULT 0,
        is_pinned INTEGER DEFAULT 0,
        is_important INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#4A90D9',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        type TEXT NOT NULL,
        uri TEXT NOT NULL,
        name TEXT NOT NULL,
        size INTEGER DEFAULT 0,
        mime_type TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        subject_id TEXT,
        chapter_id TEXT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        difficulty TEXT DEFAULT 'medium',
        next_review TEXT,
        review_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        subject_id TEXT,
        chapter_id TEXT,
        title TEXT NOT NULL,
        type TEXT DEFAULT 'multiple_choice',
        score INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS quiz_questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        question TEXT NOT NULL,
        options TEXT DEFAULT '[]',
        correct_answer TEXT NOT NULL,
        type TEXT DEFAULT 'multiple_choice',
        explanation TEXT DEFAULT '',
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        subject_id TEXT,
        duration INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        type TEXT DEFAULT 'pomodoro',
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject_id TEXT,
        chapter_id TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        repeat_type TEXT DEFAULT 'none',
        reminder_type TEXT DEFAULT 'study',
        is_completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        subject_id TEXT,
        name TEXT NOT NULL,
        exam_date TEXT NOT NULL,
        syllabus TEXT DEFAULT '',
        important_chapters TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS revision_history (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        reviewed_at TEXT NOT NULL,
        revised INTEGER DEFAULT 0,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );
    `);
  }

  private now(): string {
    return new Date().toISOString();
  }

  // Settings

  getSettings(key: string): string | null {
    const row = this.db.getFirstSync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      key
    );
    return row?.value ?? null;
  }

  setSetting(key: string, value: string): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
      key,
      value
    );
  }

  getAllSettings(): UserSetting[] {
    return this.db.getAllSync<UserSetting>('SELECT * FROM user_settings');
  }

  // Subjects

  getAllSubjects(): Subject[] {
    return this.db.getAllSync<Subject>(
      'SELECT * FROM subjects WHERE is_archived = 0 ORDER BY sort_order ASC'
    );
  }

  getSubjectById(id: string): Subject | null {
    return this.db.getFirstSync<Subject>(
      'SELECT * FROM subjects WHERE id = ?',
      id
    );
  }

  createSubject(data: { name: string; description?: string; icon?: string; color?: string }): Subject {
    const id = generateId();
    const ts = this.now();
    this.db.runSync(
      'INSERT INTO subjects (id, name, description, icon, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id,
      data.name,
      data.description ?? '',
      data.icon ?? 'book-open-variant',
      data.color ?? '#4A90D9',
      ts,
      ts
    );
    return this.getSubjectById(id)!;
  }

  updateSubject(id: string, data: Partial<Pick<Subject, 'name' | 'description' | 'icon' | 'color'>>): Subject | null {
    const existing = this.getSubjectById(id);
    if (!existing) return null;
    this.db.runSync(
      'UPDATE subjects SET name = ?, description = ?, icon = ?, color = ?, updated_at = ? WHERE id = ?',
      data.name ?? existing.name,
      data.description ?? existing.description,
      data.icon ?? existing.icon,
      data.color ?? existing.color,
      this.now(),
      id
    );
    return this.getSubjectById(id);
  }

  deleteSubject(id: string): boolean {
    const result = this.db.runSync('DELETE FROM subjects WHERE id = ?', id);
    return result.changes > 0;
  }

  getArchivedSubjects(): Subject[] {
    return this.db.getAllSync<Subject>(
      'SELECT * FROM subjects WHERE is_archived = 1 ORDER BY sort_order ASC'
    );
  }

  archiveSubject(id: string): boolean {
    const result = this.db.runSync(
      'UPDATE subjects SET is_archived = 1, updated_at = ? WHERE id = ?',
      this.now(),
      id
    );
    return result.changes > 0;
  }

  restoreSubject(id: string): boolean {
    const result = this.db.runSync(
      'UPDATE subjects SET is_archived = 0, updated_at = ? WHERE id = ?',
      this.now(),
      id
    );
    return result.changes > 0;
  }

  reorderSubjects(ids: string[]): void {
    const ts = this.now();
    for (let i = 0; i < ids.length; i++) {
      this.db.runSync(
        'UPDATE subjects SET sort_order = ?, updated_at = ? WHERE id = ?',
        i,
        ts,
        ids[i]
      );
    }
  }

  // Chapters

  getChaptersBySubject(subjectId: string): Chapter[] {
    return this.db.getAllSync<Chapter>(
      'SELECT * FROM chapters WHERE subject_id = ? ORDER BY sort_order ASC',
      subjectId
    );
  }

  getChapterById(id: string): Chapter | null {
    return this.db.getFirstSync<Chapter>(
      'SELECT * FROM chapters WHERE id = ?',
      id
    );
  }

  createChapter(data: {
    subject_id: string;
    title: string;
    description?: string;
  }): Chapter {
    const id = generateId();
    const ts = this.now();
    this.db.runSync(
      'INSERT INTO chapters (id, subject_id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      data.subject_id,
      data.title,
      data.description ?? '',
      ts,
      ts
    );
    return this.getChapterById(id)!;
  }

  updateChapter(
    id: string,
    data: Partial<Pick<Chapter, 'title' | 'description'>>
  ): Chapter | null {
    const existing = this.getChapterById(id);
    if (!existing) return null;
    this.db.runSync(
      'UPDATE chapters SET title = ?, description = ?, updated_at = ? WHERE id = ?',
      data.title ?? existing.title,
      data.description ?? existing.description,
      this.now(),
      id
    );
    return this.getChapterById(id);
  }

  deleteChapter(id: string): boolean {
    const result = this.db.runSync('DELETE FROM chapters WHERE id = ?', id);
    return result.changes > 0;
  }

  reorderChapters(subjectId: string, ids: string[]): void {
    const ts = this.now();
    for (let i = 0; i < ids.length; i++) {
      this.db.runSync(
        'UPDATE chapters SET sort_order = ?, updated_at = ? WHERE id = ? AND subject_id = ?',
        i,
        ts,
        ids[i],
        subjectId
      );
    }
  }

  markChapterCompleted(id: string, completed: boolean): boolean {
    const result = this.db.runSync(
      'UPDATE chapters SET is_completed = ?, updated_at = ? WHERE id = ?',
      completed ? 1 : 0,
      this.now(),
      id
    );
    return result.changes > 0;
  }

  // Notes

  getAllNotes(): Note[] {
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE is_archived = 0 ORDER BY is_pinned DESC, updated_at DESC'
    );
  }

  getNotesBySubject(subjectId: string): Note[] {
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE subject_id = ? AND is_archived = 0 ORDER BY is_pinned DESC, updated_at DESC',
      subjectId
    );
  }

  getNotesByChapter(chapterId: string): Note[] {
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE chapter_id = ? AND is_archived = 0 ORDER BY is_pinned DESC, updated_at DESC',
      chapterId
    );
  }

  getNoteById(id: string): Note | null {
    return this.db.getFirstSync<Note>(
      'SELECT * FROM notes WHERE id = ?',
      id
    );
  }

  createNote(data: {
    subject_id?: string;
    chapter_id?: string;
    title: string;
    content?: string;
    type?: string;
  }): Note {
    const id = generateId();
    const ts = this.now();
    this.db.runSync(
      'INSERT INTO notes (id, subject_id, chapter_id, title, content, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      data.subject_id ?? null,
      data.chapter_id ?? null,
      data.title,
      data.content ?? '',
      data.type ?? 'normal',
      ts,
      ts
    );
    return this.getNoteById(id)!;
  }

  updateNote(
    id: string,
    data: Partial<Pick<Note, 'title' | 'content' | 'type' | 'subject_id' | 'chapter_id'>>
  ): Note | null {
    const existing = this.getNoteById(id);
    if (!existing) return null;
    this.db.runSync(
      'UPDATE notes SET title = ?, content = ?, type = ?, subject_id = ?, chapter_id = ?, updated_at = ? WHERE id = ?',
      data.title ?? existing.title,
      data.content ?? existing.content,
      data.type ?? existing.type,
      data.subject_id !== undefined ? data.subject_id : existing.subject_id,
      data.chapter_id !== undefined ? data.chapter_id : existing.chapter_id,
      this.now(),
      id
    );
    return this.getNoteById(id);
  }

  deleteNote(id: string): boolean {
    const result = this.db.runSync('DELETE FROM notes WHERE id = ?', id);
    return result.changes > 0;
  }

  getFavoriteNotes(): Note[] {
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE is_favorite = 1 AND is_archived = 0 ORDER BY updated_at DESC'
    );
  }

  getBookmarkedNotes(): Note[] {
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE is_bookmarked = 1 AND is_archived = 0 ORDER BY updated_at DESC'
    );
  }

  getPinnedNotes(): Note[] {
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE is_pinned = 1 AND is_archived = 0 ORDER BY updated_at DESC'
    );
  }

  getImportantNotes(): Note[] {
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE is_important = 1 AND is_archived = 0 ORDER BY updated_at DESC'
    );
  }

  getRecentNotes(limit: number = 10): Note[] {
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE is_archived = 0 ORDER BY updated_at DESC LIMIT ?',
      limit
    );
  }

  searchNotes(query: string): Note[] {
    const pattern = `%${query}%`;
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE is_archived = 0 AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC',
      pattern,
      pattern
    );
  }

  getArchivedNotes(): Note[] {
    return this.db.getAllSync<Note>(
      'SELECT * FROM notes WHERE is_archived = 1 ORDER BY updated_at DESC'
    );
  }

  archiveNote(id: string): boolean {
    const result = this.db.runSync(
      'UPDATE notes SET is_archived = 1, updated_at = ? WHERE id = ?',
      this.now(),
      id
    );
    return result.changes > 0;
  }

  restoreNote(id: string): boolean {
    const result = this.db.runSync(
      'UPDATE notes SET is_archived = 0, updated_at = ? WHERE id = ?',
      this.now(),
      id
    );
    return result.changes > 0;
  }

  toggleFavorite(id: string): boolean {
    const note = this.getNoteById(id);
    if (!note) return false;
    this.db.runSync(
      'UPDATE notes SET is_favorite = ?, updated_at = ? WHERE id = ?',
      note.is_favorite ? 0 : 1,
      this.now(),
      id
    );
    return true;
  }

  toggleBookmark(id: string): boolean {
    const note = this.getNoteById(id);
    if (!note) return false;
    this.db.runSync(
      'UPDATE notes SET is_bookmarked = ?, updated_at = ? WHERE id = ?',
      note.is_bookmarked ? 0 : 1,
      this.now(),
      id
    );
    return true;
  }

  togglePin(id: string): boolean {
    const note = this.getNoteById(id);
    if (!note) return false;
    this.db.runSync(
      'UPDATE notes SET is_pinned = ?, updated_at = ? WHERE id = ?',
      note.is_pinned ? 0 : 1,
      this.now(),
      id
    );
    return true;
  }

  toggleImportant(id: string): boolean {
    const note = this.getNoteById(id);
    if (!note) return false;
    this.db.runSync(
      'UPDATE notes SET is_important = ?, updated_at = ? WHERE id = ?',
      note.is_important ? 0 : 1,
      this.now(),
      id
    );
    return true;
  }

  // Tags

  getAllTags(): Tag[] {
    return this.db.getAllSync<Tag>('SELECT * FROM tags ORDER BY name ASC');
  }

  createTag(data: { name: string; color?: string }): Tag {
    const id = generateId();
    this.db.runSync(
      'INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
      id,
      data.name,
      data.color ?? '#4A90D9',
      this.now()
    );
    return this.db.getFirstSync<Tag>('SELECT * FROM tags WHERE id = ?', id)!;
  }

  updateTag(
    id: string,
    data: Partial<Pick<Tag, 'name' | 'color'>>
  ): Tag | null {
    const existing = this.db.getFirstSync<Tag>('SELECT * FROM tags WHERE id = ?', id);
    if (!existing) return null;
    this.db.runSync(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      data.name ?? existing.name,
      data.color ?? existing.color,
      id
    );
    return this.db.getFirstSync<Tag>('SELECT * FROM tags WHERE id = ?', id);
  }

  deleteTag(id: string): boolean {
    const result = this.db.runSync('DELETE FROM tags WHERE id = ?', id);
    return result.changes > 0;
  }

  getTagsByNote(noteId: string): Tag[] {
    return this.db.getAllSync<Tag>(
      `SELECT t.* FROM tags t
       INNER JOIN note_tags nt ON t.id = nt.tag_id
       WHERE nt.note_id = ?
       ORDER BY t.name ASC`,
      noteId
    );
  }

  addTagToNote(noteId: string, tagId: string): void {
    this.db.runSync(
      'INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
      noteId,
      tagId
    );
  }

  removeTagFromNote(noteId: string, tagId: string): boolean {
    const result = this.db.runSync(
      'DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?',
      noteId,
      tagId
    );
    return result.changes > 0;
  }

  getNotesByTag(tagId: string): Note[] {
    return this.db.getAllSync<Note>(
      `SELECT n.* FROM notes n
       INNER JOIN note_tags nt ON n.id = nt.note_id
       WHERE nt.tag_id = ? AND n.is_archived = 0
       ORDER BY n.updated_at DESC`,
      tagId
    );
  }

  // Attachments

  getAttachmentsByNote(noteId: string): Attachment[] {
    return this.db.getAllSync<Attachment>(
      'SELECT * FROM attachments WHERE note_id = ? ORDER BY created_at ASC',
      noteId
    );
  }

  createAttachment(data: {
    note_id: string;
    type: string;
    uri: string;
    name: string;
    size?: number;
    mime_type?: string;
  }): Attachment {
    const id = generateId();
    this.db.runSync(
      'INSERT INTO attachments (id, note_id, type, uri, name, size, mime_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      data.note_id,
      data.type,
      data.uri,
      data.name,
      data.size ?? 0,
      data.mime_type ?? '',
      this.now()
    );
    return this.db.getFirstSync<Attachment>(
      'SELECT * FROM attachments WHERE id = ?',
      id
    )!;
  }

  deleteAttachment(id: string): boolean {
    const result = this.db.runSync('DELETE FROM attachments WHERE id = ?', id);
    return result.changes > 0;
  }

  // Flashcards

  getAllFlashcards(): Flashcard[] {
    return this.db.getAllSync<Flashcard>(
      'SELECT * FROM flashcards ORDER BY created_at DESC'
    );
  }

  getFlashcardsBySubject(subjectId: string): Flashcard[] {
    return this.db.getAllSync<Flashcard>(
      'SELECT * FROM flashcards WHERE subject_id = ? ORDER BY created_at DESC',
      subjectId
    );
  }

  createFlashcard(data: {
    subject_id?: string;
    chapter_id?: string;
    question: string;
    answer: string;
    difficulty?: string;
  }): Flashcard {
    const id = generateId();
    const ts = this.now();
    this.db.runSync(
      `INSERT INTO flashcards (id, subject_id, chapter_id, question, answer, difficulty, next_review, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.subject_id ?? null,
      data.chapter_id ?? null,
      data.question,
      data.answer,
      data.difficulty ?? 'medium',
      ts,
      ts,
      ts
    );
    return this.db.getFirstSync<Flashcard>(
      'SELECT * FROM flashcards WHERE id = ?',
      id
    )!;
  }

  updateFlashcard(
    id: string,
    data: Partial<Pick<Flashcard, 'question' | 'answer' | 'difficulty'>>
  ): Flashcard | null {
    const existing = this.db.getFirstSync<Flashcard>(
      'SELECT * FROM flashcards WHERE id = ?',
      id
    );
    if (!existing) return null;
    this.db.runSync(
      'UPDATE flashcards SET question = ?, answer = ?, difficulty = ?, updated_at = ? WHERE id = ?',
      data.question ?? existing.question,
      data.answer ?? existing.answer,
      data.difficulty ?? existing.difficulty,
      this.now(),
      id
    );
    return this.db.getFirstSync<Flashcard>(
      'SELECT * FROM flashcards WHERE id = ?',
      id
    );
  }

  deleteFlashcard(id: string): boolean {
    const result = this.db.runSync('DELETE FROM flashcards WHERE id = ?', id);
    return result.changes > 0;
  }

  getDueForReview(): Flashcard[] {
    const now = this.now();
    return this.db.getAllSync<Flashcard>(
      'SELECT * FROM flashcards WHERE next_review IS NOT NULL AND next_review <= ? ORDER BY next_review ASC',
      now
    );
  }

  updateReview(id: string, nextReview: string): boolean {
    const result = this.db.runSync(
      'UPDATE flashcards SET next_review = ?, review_count = review_count + 1, updated_at = ? WHERE id = ?',
      nextReview,
      this.now(),
      id
    );
    return result.changes > 0;
  }

  // Quizzes

  getAllQuizzes(): Quiz[] {
    return this.db.getAllSync<Quiz>(
      'SELECT * FROM quizzes ORDER BY created_at DESC'
    );
  }

  getQuizById(id: string): Quiz | null {
    return this.db.getFirstSync<Quiz>(
      'SELECT * FROM quizzes WHERE id = ?',
      id
    );
  }

  createQuiz(data: {
    subject_id?: string;
    chapter_id?: string;
    title: string;
    type?: string;
  }): Quiz {
    const id = generateId();
    this.db.runSync(
      'INSERT INTO quizzes (id, subject_id, chapter_id, title, type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      data.subject_id ?? null,
      data.chapter_id ?? null,
      data.title,
      data.type ?? 'multiple_choice',
      this.now()
    );
    return this.getQuizById(id)!;
  }

  updateQuiz(
    id: string,
    data: Partial<Pick<Quiz, 'title' | 'score' | 'total_questions' | 'completed_at'>>
  ): Quiz | null {
    const existing = this.getQuizById(id);
    if (!existing) return null;
    this.db.runSync(
      'UPDATE quizzes SET title = ?, score = ?, total_questions = ?, completed_at = ? WHERE id = ?',
      data.title ?? existing.title,
      data.score ?? existing.score,
      data.total_questions ?? existing.total_questions,
      data.completed_at !== undefined ? data.completed_at : existing.completed_at,
      id
    );
    return this.getQuizById(id);
  }

  deleteQuiz(id: string): boolean {
    const result = this.db.runSync('DELETE FROM quizzes WHERE id = ?', id);
    return result.changes > 0;
  }

  getQuizHistory(): Quiz[] {
    return this.db.getAllSync<Quiz>(
      'SELECT * FROM quizzes WHERE completed_at IS NOT NULL ORDER BY completed_at DESC'
    );
  }

  // Quiz Questions

  getQuizQuestions(quizId: string): QuizQuestion[] {
    return this.db.getAllSync<QuizQuestion>(
      'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY rowid ASC',
      quizId
    );
  }

  createQuizQuestion(data: {
    quiz_id: string;
    question: string;
    options?: string;
    correct_answer: string;
    type?: string;
    explanation?: string;
  }): QuizQuestion {
    const id = generateId();
    this.db.runSync(
      'INSERT INTO quiz_questions (id, quiz_id, question, options, correct_answer, type, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id,
      data.quiz_id,
      data.question,
      data.options ?? '[]',
      data.correct_answer,
      data.type ?? 'multiple_choice',
      data.explanation ?? ''
    );
    return this.db.getFirstSync<QuizQuestion>(
      'SELECT * FROM quiz_questions WHERE id = ?',
      id
    )!;
  }

  deleteQuizQuestion(id: string): boolean {
    const result = this.db.runSync(
      'DELETE FROM quiz_questions WHERE id = ?',
      id
    );
    return result.changes > 0;
  }

  // Study Sessions

  getAllStudySessions(): StudySession[] {
    return this.db.getAllSync<StudySession>(
      'SELECT * FROM study_sessions ORDER BY started_at DESC'
    );
  }

  getStudySessionsBySubject(subjectId: string): StudySession[] {
    return this.db.getAllSync<StudySession>(
      'SELECT * FROM study_sessions WHERE subject_id = ? ORDER BY started_at DESC',
      subjectId
    );
  }

  getStudySessionsByDateRange(startDate: string, endDate: string): StudySession[] {
    return this.db.getAllSync<StudySession>(
      'SELECT * FROM study_sessions WHERE started_at >= ? AND started_at <= ? ORDER BY started_at DESC',
      startDate,
      endDate
    );
  }

  createStudySession(data: {
    subject_id?: string;
    duration: number;
    started_at: string;
    ended_at?: string;
    type?: string;
  }): StudySession {
    const id = generateId();
    this.db.runSync(
      'INSERT INTO study_sessions (id, subject_id, duration, started_at, ended_at, type) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      data.subject_id ?? null,
      data.duration,
      data.started_at,
      data.ended_at ?? null,
      data.type ?? 'pomodoro'
    );
    return this.db.getFirstSync<StudySession>(
      'SELECT * FROM study_sessions WHERE id = ?',
      id
    )!;
  }

  getStudyStats(): {
    totalSessions: number;
    totalDuration: number;
    averageDuration: number;
  } {
    const row = this.db.getFirstSync<{
      total_sessions: number;
      total_duration: number;
      avg_duration: number;
    }>(
      `SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(duration), 0) as total_duration,
        COALESCE(AVG(duration), 0) as avg_duration
       FROM study_sessions`
    );
    return {
      totalSessions: row?.total_sessions ?? 0,
      totalDuration: row?.total_duration ?? 0,
      averageDuration: Math.round(row?.avg_duration ?? 0),
    };
  }

  // Reminders

  getAllReminders(): Reminder[] {
    return this.db.getAllSync<Reminder>(
      'SELECT * FROM reminders ORDER BY date ASC, time ASC'
    );
  }

  getUpcomingReminders(): Reminder[] {
    const now = this.now();
    return this.db.getAllSync<Reminder>(
      'SELECT * FROM reminders WHERE is_completed = 0 AND date >= ? ORDER BY date ASC, time ASC',
      now
    );
  }

  createReminder(data: {
    title: string;
    subject_id?: string;
    chapter_id?: string;
    date: string;
    time: string;
    repeat_type?: string;
    reminder_type?: string;
  }): Reminder {
    const id = generateId();
    this.db.runSync(
      'INSERT INTO reminders (id, title, subject_id, chapter_id, date, time, repeat_type, reminder_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      data.title,
      data.subject_id ?? null,
      data.chapter_id ?? null,
      data.date,
      data.time,
      data.repeat_type ?? 'none',
      data.reminder_type ?? 'study',
      this.now()
    );
    return this.db.getFirstSync<Reminder>(
      'SELECT * FROM reminders WHERE id = ?',
      id
    )!;
  }

  updateReminder(
    id: string,
    data: Partial<Pick<Reminder, 'title' | 'date' | 'time' | 'repeat_type' | 'reminder_type'>>
  ): Reminder | null {
    const existing = this.db.getFirstSync<Reminder>(
      'SELECT * FROM reminders WHERE id = ?',
      id
    );
    if (!existing) return null;
    this.db.runSync(
      'UPDATE reminders SET title = ?, date = ?, time = ?, repeat_type = ?, reminder_type = ? WHERE id = ?',
      data.title ?? existing.title,
      data.date ?? existing.date,
      data.time ?? existing.time,
      data.repeat_type ?? existing.repeat_type,
      data.reminder_type ?? existing.reminder_type,
      id
    );
    return this.db.getFirstSync<Reminder>(
      'SELECT * FROM reminders WHERE id = ?',
      id
    );
  }

  deleteReminder(id: string): boolean {
    const result = this.db.runSync('DELETE FROM reminders WHERE id = ?', id);
    return result.changes > 0;
  }

  toggleReminderComplete(id: string): boolean {
    const reminder = this.db.getFirstSync<Reminder>(
      'SELECT * FROM reminders WHERE id = ?',
      id
    );
    if (!reminder) return false;
    this.db.runSync(
      'UPDATE reminders SET is_completed = ? WHERE id = ?',
      reminder.is_completed ? 0 : 1,
      id
    );
    return true;
  }

  // Exams

  getAllExams(): Exam[] {
    return this.db.getAllSync<Exam>(
      'SELECT * FROM exams ORDER BY exam_date ASC'
    );
  }

  getUpcomingExams(): Exam[] {
    const now = this.now();
    return this.db.getAllSync<Exam>(
      'SELECT * FROM exams WHERE exam_date >= ? ORDER BY exam_date ASC',
      now
    );
  }

  createExam(data: {
    subject_id?: string;
    name: string;
    exam_date: string;
    syllabus?: string;
    important_chapters?: string;
  }): Exam {
    const id = generateId();
    const ts = this.now();
    this.db.runSync(
      'INSERT INTO exams (id, subject_id, name, exam_date, syllabus, important_chapters, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      data.subject_id ?? null,
      data.name,
      data.exam_date,
      data.syllabus ?? '',
      data.important_chapters ?? '[]',
      ts,
      ts
    );
    return this.db.getFirstSync<Exam>('SELECT * FROM exams WHERE id = ?', id)!;
  }

  updateExam(
    id: string,
    data: Partial<Pick<Exam, 'name' | 'exam_date' | 'syllabus' | 'important_chapters'>>
  ): Exam | null {
    const existing = this.db.getFirstSync<Exam>(
      'SELECT * FROM exams WHERE id = ?',
      id
    );
    if (!existing) return null;
    this.db.runSync(
      'UPDATE exams SET name = ?, exam_date = ?, syllabus = ?, important_chapters = ?, updated_at = ? WHERE id = ?',
      data.name ?? existing.name,
      data.exam_date ?? existing.exam_date,
      data.syllabus ?? existing.syllabus,
      data.important_chapters ?? existing.important_chapters,
      this.now(),
      id
    );
    return this.db.getFirstSync<Exam>('SELECT * FROM exams WHERE id = ?', id);
  }

  deleteExam(id: string): boolean {
    const result = this.db.runSync('DELETE FROM exams WHERE id = ?', id);
    return result.changes > 0;
  }

  // Revision History

  getRevisionHistoryByNote(noteId: string): RevisionHistory[] {
    return this.db.getAllSync<RevisionHistory>(
      'SELECT * FROM revision_history WHERE note_id = ? ORDER BY reviewed_at DESC',
      noteId
    );
  }

  createRevisionEntry(noteId: string, revised: boolean = false): RevisionHistory {
    const id = generateId();
    this.db.runSync(
      'INSERT INTO revision_history (id, note_id, reviewed_at, revised) VALUES (?, ?, ?, ?)',
      id,
      noteId,
      this.now(),
      revised ? 1 : 0
    );
    return this.db.getFirstSync<RevisionHistory>(
      'SELECT * FROM revision_history WHERE id = ?',
      id
    )!;
  }

  getRevisionStats(noteId: string): {
    totalReviews: number;
    revisedCount: number;
    lastReviewed: string | null;
  } {
    const row = this.db.getFirstSync<{
      total_reviews: number;
      revised_count: number;
      last_reviewed: string | null;
    }>(
      `SELECT
        COUNT(*) as total_reviews,
        SUM(CASE WHEN revised = 1 THEN 1 ELSE 0 END) as revised_count,
        MAX(reviewed_at) as last_reviewed
       FROM revision_history
       WHERE note_id = ?`,
      noteId
    );
    return {
      totalReviews: row?.total_reviews ?? 0,
      revisedCount: row?.revised_count ?? 0,
      lastReviewed: row?.last_reviewed ?? null,
    };
  }
}

const dbManager = new DatabaseManager();
dbManager.init();

export function initDatabase(): DatabaseManager {
  return dbManager;
}

export { dbManager as db };
export default DatabaseManager;
export type {
  UserSetting,
  Subject,
  Chapter,
  Note,
  Tag,
  Attachment,
  Flashcard,
  Quiz,
  QuizQuestion,
  StudySession,
  Reminder,
  Exam,
  RevisionHistory,
};
