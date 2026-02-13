
export type HabitFrequencyType = 'daily' | 'weekdays' | 'specific_days' | 'times_per_week' | 'interval';
export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';
export type LayoutDensity = 'compact' | 'comfortable' | 'roomy';
export type FontFamily = 'Inter' | 'JetBrains Mono' | 'Lora' | 'System';

export interface HabitFrequencyRule {
  type: HabitFrequencyType;
  daysOfWeek?: number[]; // 0 to 6
  timesPerWeek?: number;
  intervalDays?: number;
}

export interface Habit {
  id: string;
  name: string;
  backupName?: string;
  category: string; 
  frequency: HabitFrequencyRule;
  timeOfDay?: TimeOfDay;
  reminderTime?: string; // HH:mm
  archived: boolean;
  createdAtISO: string;
  updatedAtISO: string;
}

export type CompletionType = 'primary' | 'backup';

export interface HabitCompletion {
  id: string;
  habitId: string;
  localDate: string; // YYYY-MM-DD
  completedType: CompletionType;
  note?: string;
  createdAtISO: string;
  tzOffsetMinutes: number;
}

export interface HabitMissReflection {
  id: string;
  habitId: string;
  localDate: string;
  reason: string;
  createdAtISO: string;
}

export type JournalFieldType = 'short_text' | 'long_text' | 'slider' | 'single_choice' | 'multi_choice' | 'date' | 'time' | 'number' | 'yes_no';

export interface JournalField {
  id: string;
  key: string;
  label: string;
  description?: string;
  type: JournalFieldType;
  required: boolean;
  options?: string[];
  sliderMin?: number;
  sliderMax?: number;
}

export interface JournalTemplate {
  id: string;
  name: string;
  fields: JournalField[];
  suggestedFields: JournalField[];
  createdAtISO: string;
  updatedAtISO: string;
  archived: boolean;
}

export interface JournalEntry {
  id: string;
  localDate: string; // YYYY-MM-DD
  createdAtISO: string;
  templateId: string;
  tags: string[];
  mood?: number; // 1 to 10
  data: Record<string, any>;
  aiFeedback?: string;
}

export type ThemeName = 'Light' | 'Dark' | 'Midnight' | 'Cyber' | 'Matcha' | 'Rose' | 'Ocean' | 'Forest';

export interface AppSettings {
  displayName: string;
  avatar?: string;
  theme: ThemeName;
  layoutDensity: LayoutDensity;
  fontFamily: FontFamily;
  accentColorOverride?: string;
  fontScale: number;
  remindersEnabled: boolean;
  aiEnabled: boolean;
  aiExcludedTags: string[];
  weeklyReviewDay: number; // 0 to 6
  weeklyReviewTime: string; // HH:mm
  privacyMode: 'local_only' | 'ai_on';
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  costXp: number;
  active: boolean;
  createdAtISO: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  costXp: number;
  createdAtISO: string;
}
