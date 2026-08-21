import { Chapter, Note, StudySession, Subject } from '../types';
import { APP_NAME, APP_VERSION, CREATED_BY } from '../constants';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 0) minutes = 0;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function truncate(str: string, length: number): string {
  if (length < 0) length = 0;
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getStudyStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  const uniqueDays = new Set<string>();
  for (const session of sessions) {
    const date = new Date(session.startedAt);
    if (isNaN(date.getTime())) continue;
    uniqueDays.add(date.toISOString().split('T')[0]);
  }
  if (uniqueDays.size === 0) return 0;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (!uniqueDays.has(todayStr) && !uniqueDays.has(yesterdayStr)) return 0;
  let streak = 0;
  let checkDate = uniqueDays.has(todayStr) ? today : yesterday;
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (uniqueDays.has(dateStr)) {
      streak++;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getDailyStudyMinutes(sessions: StudySession[]): number {
  const today = new Date().toISOString().split('T')[0];
  let totalSeconds = 0;
  for (const session of sessions) {
    if (session.startedAt.startsWith(today)) {
      totalSeconds += session.duration;
    }
  }
  return Math.round(totalSeconds / 60);
}

export function getWeeklyStudyMinutes(sessions: StudySession[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  let totalSeconds = 0;
  for (const session of sessions) {
    const sessionDate = new Date(session.startedAt);
    if (sessionDate >= startOfWeek) {
      totalSeconds += session.duration;
    }
  }
  return Math.round(totalSeconds / 60);
}

export function calculateProgress(completed: number, total: number): number {
  if (total <= 0) return 0;
  const progress = Math.round((completed / total) * 100);
  return Math.min(100, Math.max(0, progress));
}

const ICON_EMOJI_MAP: Record<string, string> = {
  'calculator-variant': '🔢',
  'atom': '⚛️',
  'flask-outline': '🧪',
  'leaf': '🍃',
  'book-open-variant': '📖',
  'translate': '🌐',
  'laptop': '💻',
  'clock-outline': '🕐',
  'music-note': '🎵',
  'palette': '🎨',
  'brain': '🧠',
  'earth': '🌍',
  'chart-line': '📊',
  'camera': '📷',
  'dumbbell': '🏋️',
  'food-apple-outline': '🍎',
  'car': '🚗',
  'lightbulb-on': '💡',
  'finance': '💰',
  'silverware-fork-knife': '🍽️',
};

export function getSubjectEmoji(icon: string): string {
  return ICON_EMOJI_MAP[icon] || '📚';
}

export function exportNoteAsMarkdown(
  note: Note,
  subject?: Subject,
  chapter?: Chapter,
): string {
  let md = `# ${note.title}\n\n`;
  const meta: string[] = [];
  if (subject) meta.push(`**Subject:** ${subject.name}`);
  if (chapter) meta.push(`**Chapter:** ${chapter.title}`);
  meta.push(`**Type:** ${note.type}`);
  if (note.tags.length > 0) meta.push(`**Tags:** ${note.tags.join(', ')}`);
  meta.push(`**Created:** ${formatDate(note.createdAt)}`);
  meta.push(`**Updated:** ${formatDate(note.updatedAt)}`);
  md += meta.join('\n') + '\n\n---\n\n';
  md += note.content + '\n';
  return md;
}

export function exportNoteAsText(note: Note): string {
  let text = `${note.title}\n${'='.repeat(note.title.length)}\n\n`;
  text += `Type: ${note.type}\n`;
  if (note.tags.length > 0) text += `Tags: ${note.tags.join(', ')}\n`;
  text += `Created: ${formatDate(note.createdAt)}\n`;
  text += `Updated: ${formatDate(note.updatedAt)}\n\n`;
  text += note.content + '\n';
  return text;
}

export function exportAllAsJSON(data: any): string {
  const exportData = {
    metadata: {
      appName: APP_NAME,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      createdBy: CREATED_BY,
    },
    data,
  };
  return JSON.stringify(exportData, null, 2);
}

export function parseImportedJSON(jsonStr: string): { valid: boolean; data: any; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, data: null, error: 'Invalid JSON structure' };
    }
    if (!parsed.metadata || !parsed.data) {
      return { valid: false, data: null, error: 'Missing metadata or data fields' };
    }
    if (!parsed.metadata.appName || !parsed.metadata.exportedAt) {
      return { valid: false, data: null, error: 'Invalid metadata structure' };
    }
    return { valid: true, data: parsed.data };
  } catch {
    return { valid: false, data: null, error: 'Failed to parse JSON' };
  }
}

export function getColorWithOpacity(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  let r: number, g: number, b: number;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  if (isNaN(r)) r = 0;
  if (isNaN(g)) g = 0;
  if (isNaN(b)) b = 0;
  const clampedOpacity = Math.min(1, Math.max(0, opacity));
  return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`;
}

export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  let r: number, g: number, b: number;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  if (isNaN(r)) r = 0;
  if (isNaN(g)) g = 0;
  if (isNaN(b)) b = 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
