# 📚 Study Notes

**Your All-in-One Offline Educational Notes Application**

<p align="center">
  <img src="assets/icon.png" alt="Study Notes Logo" width="120" />
</p>

<p align="center">
  <a href="https://github.com/joydipsarkar829-debug/StudyNotes/actions/workflows/build.yml">
    <img src="https://github.com/joydipsarkar829-debug/StudyNotes/actions/workflows/build.yml/badge.svg" alt="Build APK" />
  </a>
  <img src="https://img.shields.io/badge/React%20Native-0.86.2-blue" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK%2057-brightgreen" alt="Expo SDK" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Android-7%2B-brightgreen" alt="Android" />
</p>

---

## 📱 About

**Study Notes** is a complete, production-quality Android educational notes application built with React Native and Expo. It allows students to organize subjects, chapters, notes, study materials, important topics, formulas, questions, bookmarks, and personal study resources — all in one place.

**100% offline-first. No internet required for core features.**

---

## ✨ Features

### 🏠 Home Dashboard
- Greeting section based on time of day
- Today's study summary with stats cards
- Total subjects, notes, important notes, bookmarked notes
- Study streak and today's study time
- Quick action buttons (Add Note, Add Subject, Search, Favorites, Timer, Revision)
- Continue Studying section
- Recently Added & Recently Viewed notes
- Beautiful empty states

### 📖 Subject Management
- Create, edit, delete, archive, restore subjects
- Custom subject icons (20+ MaterialCommunityIcons)
- Subject color picker (10+ colors)
- Subject description
- Reorder subjects
- Chapter & note count per subject
- Progress percentage tracking
- Last studied time

### 📑 Chapter Management
- Create, edit, delete, reorder chapters
- Mark as completed
- Chapter progress tracking
- Notes count per chapter
- Important topics display

### ✏️ Advanced Note Editor
- Title, subject, chapter, tags
- Plain text editing with auto-save
- Formatting toolbar: Bold, Italic, Underline, Lists, Headings, Code, Quotes
- Multiple note types: Normal, Quick, Revision, Formula, Q&A, Definition, Important Topic, Assignment, To-Do, Exam Prep
- Auto-save drafts (every 3 seconds)
- Subject & chapter picker
- Tag management

### 📝 Note Reader
- Distraction-free reading view
- Adjustable content display
- Favorite, Bookmark, Pin, Important toggles
- Share via Android native share sheet
- Copy to clipboard
- Edit, Delete, Archive actions
- Created & updated timestamps

### 🔍 Search System
- Full-text search across notes
- Filter by subject, chapter, note type, favorites, important
- Search suggestions & recent searches
- Highlighted matching text

### ⭐ Favorites & Bookmarks
- Favorite notes screen
- Bookmarked notes screen
- Pinned notes
- Important notes

### 🏷️ Tag System
- Custom tags with colors
- Create, rename, delete tags
- Filter notes by tags
- Add/remove tags per note

### ⏱️ Study Timer
- Pomodoro mode (25min work / 5min break / 15min long break)
- Custom timer
- Start, Pause, Resume, Reset
- Associate sessions with subjects
- Session history
- Daily, weekly, streak tracking

### 📊 Study Statistics
- Daily, weekly, monthly study time
- Completed chapters & notes count
- Study streak tracking
- Most studied subject
- 7-day bar chart (no external libraries)
- Recent activity feed

### 🔄 Quick Revision Mode
- Select revision scope: All Notes, Favorites, Important, By Subject, By Tags
- Clean distraction-free reading interface
- Previous/Next navigation
- Mark as Revised
- Bookmark & Favorite toggles
- Revision session summary
- Revision history tracking

### 🃏 Flashcards
- Create flashcards with Question & Answer
- Subject & chapter association
- Difficulty levels: Easy, Medium, Hard
- Flip card animation (react-native-reanimated)
- Review mode with spaced repetition
- Due for review tracking
- CRUD operations

### 🧪 Quiz Mode
- Create quizzes from personal questions
- Multiple Choice, True/False, Short Answer
- Add questions with options and explanations
- Random question order
- Score tracking & progress
- Correct/incorrect feedback
- Quiz history

### 📁 Backup & Restore
- Export all data as JSON
- Import backup with validation
- Confirmation before overwrite
- Data integrity checks

### 🌙 Dark Mode
- Light Mode
- Dark Mode
- System Default
- Complete theming across all screens

### 🎨 Theming
- 8 accent colors
- 3 font sizes
- Centralized theme system
- Consistent design language

### 📋 Settings
- Theme selector
- Accent color picker
- Font size control
- Default note type
- Auto-save toggle
- Study/Revision reminders
- Backup & Restore
- Clear all data
- About section

### 🚀 Onboarding
- 4-page welcome flow
- Theme selection
- Skip option

---

## 🏗️ Architecture

### Project Structure

```
StudyNotes/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout (theme, DB init)
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── _layout.tsx           # Tab navigator config
│   │   ├── index.tsx             # Home Dashboard
│   │   ├── subjects.tsx          # Subjects List
│   │   ├── notes.tsx             # Notes List
│   │   ├── revision.tsx          # Quick Revision
│   │   └── settings.tsx          # Settings
│   ├── subject/
│   │   ├── [id].tsx              # Subject Detail
│   │   └── new.tsx               # Create/Edit Subject
│   ├── chapter/
│   │   └── [id].tsx              # Chapter Detail
│   ├── note/
│   │   ├── [id].tsx              # Note Reader
│   │   └── editor.tsx            # Note Editor
│   ├── search.tsx                # Search
│   ├── flashcards.tsx            # Flashcards
│   ├── quiz.tsx                  # Quiz Mode
│   ├── timer.tsx                 # Study Timer
│   ├── statistics.tsx            # Statistics
│   ├── favorites.tsx             # Favorites
│   ├── bookmarks.tsx             # Bookmarks
│   └── onboarding.tsx            # Onboarding
├── src/
│   ├── components/               # 24 reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── EmptySubject.tsx
│   │   ├── FAB.tsx
│   │   ├── FilterChip.tsx
│   │   ├── FlashcardView.tsx
│   │   ├── Header.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MenuItem.tsx
│   │   ├── Modal.tsx
│   │   ├── NoteCard.tsx
│   │   ├── NoteTypeBadge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── QuizOption.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── StatCard.tsx
│   │   ├── SubjectCard.tsx
│   │   ├── TagChip.tsx
│   │   └── TimerDisplay.tsx
│   ├── constants/                # App constants
│   │   └── index.ts
│   ├── database/                 # SQLite database layer
│   │   └── index.ts
│   ├── store/                    # Zustand state management
│   │   ├── index.ts
│   │   ├── useAppStore.ts
│   │   ├── useFlashcardStore.ts
│   │   ├── useNoteStore.ts
│   │   ├── useQuizStore.ts
│   │   ├── useSubjectStore.ts
│   │   ├── useTagStore.ts
│   │   └── useTimerStore.ts
│   ├── theme/                    # Theme system
│   │   └── index.ts
│   ├── types/                    # TypeScript types
│   │   └── index.ts
│   └── utils/                    # Utility functions
│       ├── index.ts
│       └── validators.ts
├── assets/                       # App icons & images
├── .github/workflows/            # GitHub Actions
│   └── build.yml
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
└── yarn.lock
```

### Database Schema

14 tables using Expo SQLite:

| Table | Description |
|-------|-------------|
| `user_settings` | Key-value app settings |
| `subjects` | Subject definitions |
| `chapters` | Chapter definitions per subject |
| `notes` | All notes with types |
| `tags` | Custom tags |
| `note_tags` | Note-tag many-to-many relation |
| `attachments` | File attachments per note |
| `flashcards` | Flashcard questions & answers |
| `quizzes` | Quiz definitions |
| `quiz_questions` | Questions per quiz |
| `study_sessions` | Timer session history |
| `reminders` | Study reminders |
| `exams` | Exam schedule |
| `revision_history` | Revision tracking |

### Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React Native | 0.86.2 | Mobile framework |
| Expo SDK | 57 | Development platform |
| TypeScript | 6.0 | Type safety |
| Expo Router | 57 | File-based navigation |
| Expo SQLite | 57 | Local database |
| Zustand | 5.x | State management |
| React Navigation | 7.x | Navigation |
| React Native Reanimated | 3.18 | Animations |
| React Native Gesture Handler | 2.24 | Touch gestures |
| @expo/vector-icons | 14.x | Icons |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.13+
- [Yarn](https://yarnpkg.com/) or npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio (for building APK)

### Installation

```bash
# Clone the repository
git clone https://github.com/joydipsarkar829-debug/StudyNotes.git

# Navigate to the project
cd StudyNotes

# Install dependencies
yarn install

# Start the development server
npx expo start
```

### Running on Android

```bash
# Start with Android
npx expo start --android

# Or build APK directly
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

### Building APK via GitHub Actions

The project includes a GitHub Actions workflow that automatically builds the APK on every push to `main`. 

1. Go to [Actions tab](https://github.com/joydipsarkar829-debug/StudyNotes/actions)
2. Click on "Build Android APK"
3. Download the APK artifact when build completes

---

## 📱 App Information

| Property | Value |
|----------|-------|
| **App Name** | Study Notes |
| **Package** | `com.joydip.studyNotes` |
| **Version** | 1.0.0 |
| **Min Android** | 7+ (API 24) |
| **Target SDK** | 36 |
| **Orientation** | Portrait |
| **Created By** | Joydip Sarkar |

---

## 🎯 Design Principles

- **Offline-First**: All data stored locally in SQLite
- **Material Design**: Modern, clean UI with proper spacing and hierarchy
- **Responsive**: Works on small and large Android phones
- **Accessible**: Large touch targets, screen reader labels, good contrast
- **Performant**: Optimized for low-end devices with lazy loading and efficient queries
- **Modular**: 24 reusable components, clean separation of concerns

---

## 📜 License

© 2026 Created by **Joydip Sarkar**

---

## 🙏 Credits

Built with ❤️ using React Native, Expo, and TypeScript.
