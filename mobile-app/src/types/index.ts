export type Role = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  createdAt?: string;
}

export type FrequencyType = 'DAILY' | 'WEEKLY_DAYS' | 'TIMES_PER_PERIOD';
export type TargetType = 'BOOLEAN' | 'NUMERIC';

export interface StreakRecord {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  freezeCountRemaining: number;
  updatedAt?: string;
}

export interface Habit {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string | null;
  frequencyType: FrequencyType;
  frequencyPayload?: number[] | any; // e.g. [1, 3, 5] for Mon, Wed, Fri
  targetType: TargetType;
  targetValue?: number | null;
  unit?: string | null;
  reminderTime?: string | null; // "HH:mm"
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  streak?: StreakRecord;
  // Local state for today's checklist
  todayCompletion?: HabitCompletion | null;
}

export type CompletionStatus = 'COMPLETED' | 'SKIPPED';

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: CompletionStatus;
  value?: number;
  notes?: string | null;
  completedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HabitTemplate {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  frequencyType: FrequencyType;
  frequencyPayload?: number[] | any;
  targetType: TargetType;
  targetValue?: number | null;
  unit?: string | null;
  icon: string;
  color: string;
  isPublished: boolean;
  category?: Category;
  createdAt?: string;
}

export interface Milestone {
  days: number;
  title: string;
  achieved: boolean;
  achievedAt?: string;
}

export interface AnalyticsSummary {
  completionRate7d: number;
  completionRate30d: number;
  completionRateAllTime: number;
  activeHabitsCount: number;
  totalCompletions: number;
  currentBestStreak: number;
  milestones: Milestone[];
}

export type HeatmapDayStatus = 'FULL' | 'PARTIAL' | 'MISSED' | 'OFF_DAY';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  completionRate: number; // 0 to 1
  totalScheduled: number;
  totalCompleted: number;
  status: HeatmapDayStatus;
}

export interface OfflineAction {
  id: string;
  type: 'LOG_COMPLETION' | 'DELETE_COMPLETION' | 'CREATE_HABIT' | 'UPDATE_HABIT' | 'APPLY_FREEZE';
  habitId?: string;
  date?: string;
  payload?: any;
  timestamp: number;
}
