import { create } from 'zustand';
import { db } from '../database';
import { StudySession } from '../types';

interface TimerStats {
  dailyMinutes: number;
  weeklyMinutes: number;
  streak: number;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  isBreak: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  currentSubjectId: string | null;
  sessions: StudySession[];
  dailyMinutes: number;
  weeklyMinutes: number;
  streak: number;
  setRunning: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  setBreak: (value: boolean) => void;
  setSecondsRemaining: (seconds: number) => void;
  setTotalSeconds: (seconds: number) => void;
  setCurrentSubject: (subjectId: string | null) => void;
  setSessions: (sessions: StudySession[]) => void;
  setStats: (stats: Partial<TimerStats>) => void;
  startTimer: (duration: number, subjectId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  completeSession: () => void;
  loadSessions: () => void;
}

function mapDbSession(raw: any): StudySession {
  return {
    id: raw.id,
    subjectId: raw.subject_id,
    duration: raw.duration,
    startedAt: raw.started_at,
    endedAt: raw.ended_at,
    type: raw.type as StudySession['type'],
  };
}

function calculateStats(sessions: StudySession[]): TimerStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const dailyMinutes = sessions
    .filter((s) => s.startedAt >= todayStart)
    .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);

  const weeklyMinutes = sessions
    .filter((s) => s.startedAt >= weekStart)
    .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);

  let streak = 0;
  const dayMs = 24 * 60 * 60 * 1000;
  let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  while (true) {
    const dayStr = checkDate.toISOString();
    const prevDayStr = new Date(checkDate.getTime() - dayMs).toISOString();
    const hasSession = sessions.some(
      (s) => s.startedAt >= prevDayStr && s.startedAt < dayStr
    );
    if (!hasSession) break;
    streak++;
    checkDate = new Date(checkDate.getTime() - dayMs);
  }

  return { dailyMinutes, weeklyMinutes, streak };
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  isBreak: false,
  secondsRemaining: 0,
  totalSeconds: 0,
  currentSubjectId: null,
  sessions: [],
  dailyMinutes: 0,
  weeklyMinutes: 0,
  streak: 0,

  setRunning: (isRunning) => set({ isRunning }),
  setPaused: (isPaused) => set({ isPaused }),
  setBreak: (isBreak) => set({ isBreak }),
  setSecondsRemaining: (secondsRemaining) => set({ secondsRemaining }),
  setTotalSeconds: (totalSeconds) => set({ totalSeconds }),
  setCurrentSubject: (currentSubjectId) => set({ currentSubjectId }),
  setSessions: (sessions) => {
    const stats = calculateStats(sessions);
    set({ sessions, ...stats });
  },
  setStats: (stats) => set(stats),

  startTimer: (duration, subjectId) => {
    set({
      isRunning: true,
      isPaused: false,
      isBreak: false,
      secondsRemaining: duration,
      totalSeconds: duration,
      currentSubjectId: subjectId ?? null,
    });
  },

  pauseTimer: () => {
    set({ isPaused: true });
  },

  resumeTimer: () => {
    set({ isPaused: false });
  },

  resetTimer: () => {
    set({
      isRunning: false,
      isPaused: false,
      isBreak: false,
      secondsRemaining: 0,
      totalSeconds: 0,
    });
  },

  completeSession: () => {
    const state = get();
    const now = new Date().toISOString();
    const duration = state.totalSeconds;

    const raw = db.createStudySession({
      subject_id: state.currentSubjectId ?? undefined,
      duration,
      started_at: new Date(Date.now() - duration * 1000).toISOString(),
      ended_at: now,
      type: state.isBreak ? 'revision' : 'pomodoro',
    });

    if (raw) {
      const session = mapDbSession(raw);
      const sessions = [session, ...state.sessions];
      const stats = calculateStats(sessions);
      set({
        sessions,
        ...stats,
        isRunning: false,
        isPaused: false,
        isBreak: false,
        secondsRemaining: 0,
        totalSeconds: 0,
      });
    }
  },

  loadSessions: () => {
    const rawSessions = db.getAllStudySessions();
    const sessions = rawSessions.map(mapDbSession);
    const stats = calculateStats(sessions);
    set({ sessions, ...stats });
  },
}));
