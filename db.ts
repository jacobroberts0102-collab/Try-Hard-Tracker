
import { 
  Habit, HabitCompletion, JournalTemplate, JournalEntry, AppSettings, Reward, RewardRedemption
} from './types';

const KEYS = {
  HABITS: 'cripes_habits',
  COMPLETIONS: 'cripes_completions',
  TEMPLATES: 'cripes_templates',
  ENTRIES: 'cripes_entries',
  SETTINGS: 'cripes_settings',
  CATEGORIES: 'cripes_categories',
  REWARDS: 'cripes_rewards',
  REDEMPTIONS: 'cripes_redemptions',
};

const DEFAULT_CATEGORIES = [
  'Career', 'Relationships', 'Intellectual', 'Physical', 'Emotional', 'Spiritual'
];

const get = <T,>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const set = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const INITIAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'default-daily',
    name: 'Daily Check-in',
    archived: false,
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
    suggestedFields: [],
    fields: [
      { id: 'f1', key: 'mood', label: 'How are you feeling?', type: 'slider', required: true, sliderMin: 1, sliderMax: 10 },
      { id: 'f2', key: 'highlights', label: 'What went well today?', type: 'long_text', required: true },
      { id: 'f3', key: 'gratitude', label: 'One thing you are grateful for?', type: 'short_text', required: false }
    ]
  },
  {
    id: 'cripes-methodology',
    name: 'CRIPES Daily Review',
    archived: false,
    createdAtISO: new Date().toISOString(),
    updatedAtISO: new Date().toISOString(),
    suggestedFields: [],
    fields: [
      { id: 'c1', key: 'career', label: 'Career: What did I build or accomplish?', type: 'long_text', required: true },
      { id: 'c2', key: 'relationships', label: 'Relationships: Who did I connect with?', type: 'long_text', required: true },
      { id: 'c3', key: 'intellectual', label: 'Intellectual: What did I learn today?', type: 'long_text', required: true },
      { id: 'c4', key: 'physical_energy', label: 'Physical: Energy Level (1-10)', type: 'slider', required: true, sliderMin: 1, sliderMax: 10 },
      { id: 'c5', key: 'physical_notes', label: 'Physical: Movement and Nourishment', type: 'short_text', required: false },
      { id: 'c6', key: 'emotional', label: 'Emotional: Primary state of mind', type: 'short_text', required: true },
      { id: 'c7', key: 'spiritual', label: 'Spiritual: Value alignment and peace', type: 'long_text', required: true }
    ]
  }
];

export const db = {
  getCategories: () => get<string[]>(KEYS.CATEGORIES, DEFAULT_CATEGORIES),
  saveCategories: (categories: string[]) => set(KEYS.CATEGORIES, categories),

  getHabits: () => get<Habit[]>(KEYS.HABITS, []),
  saveHabit: (habit: Habit) => {
    const habits = db.getHabits();
    const index = habits.findIndex(h => h.id === habit.id);
    if (index >= 0) habits[index] = habit;
    else habits.push(habit);
    set(KEYS.HABITS, habits);
  },
  deleteHabit: (id: string) => {
    const habits = db.getHabits().filter(h => h.id !== id);
    set(KEYS.HABITS, habits);
  },

  getCompletions: () => get<HabitCompletion[]>(KEYS.COMPLETIONS, []),
  addCompletion: (completion: HabitCompletion) => {
    const completions = db.getCompletions();
    completions.push(completion);
    set(KEYS.COMPLETIONS, completions);
  },
  removeCompletion: (habitId: string, localDate: string) => {
    const completions = db.getCompletions().filter(c => !(c.habitId === habitId && c.localDate === localDate));
    set(KEYS.COMPLETIONS, completions);
  },
  deleteCompletionById: (id: string) => {
    const completions = db.getCompletions().filter(c => c.id !== id);
    set(KEYS.COMPLETIONS, completions);
  },

  getTemplates: () => get<JournalTemplate[]>(KEYS.TEMPLATES, INITIAL_TEMPLATES),
  saveTemplate: (template: JournalTemplate) => {
    const templates = db.getTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    if (index >= 0) templates[index] = template;
    else templates.push(template);
    set(KEYS.TEMPLATES, templates);
  },

  getEntries: () => get<JournalEntry[]>(KEYS.ENTRIES, []),
  saveEntry: (entry: JournalEntry) => {
    const entries = db.getEntries();
    const index = entries.findIndex(e => e.id === entry.id);
    if (index >= 0) entries[index] = entry;
    else entries.push(entry);
    set(KEYS.ENTRIES, entries);
  },
  deleteEntry: (id: string) => {
    const entries = db.getEntries().filter(e => e.id !== id);
    set(KEYS.ENTRIES, entries);
  },

  getRewards: () => get<Reward[]>(KEYS.REWARDS, []),
  saveReward: (reward: Reward) => {
    const rewards = db.getRewards();
    const index = rewards.findIndex(r => r.id === reward.id);
    if (index >= 0) rewards[index] = reward;
    else rewards.push(reward);
    set(KEYS.REWARDS, rewards);
  },
  deleteReward: (id: string) => {
    const rewards = db.getRewards().filter(r => r.id !== id);
    set(KEYS.REWARDS, rewards);
  },

  getRedemptions: () => get<RewardRedemption[]>(KEYS.REDEMPTIONS, []),
  addRedemption: (redemption: RewardRedemption) => {
    const redemptions = db.getRedemptions();
    redemptions.push(redemption);
    set(KEYS.REDEMPTIONS, redemptions);
  },

  getSettings: (): AppSettings => get<AppSettings>(KEYS.SETTINGS, {
    displayName: 'Jacob',
    theme: 'Cyber',
    accentColorOverride: '#10B981',
    layoutDensity: 'compact',
    fontFamily: 'JetBrains Mono',
    fontScale: 0.9,
    remindersEnabled: true,
    aiEnabled: true,
    aiExcludedTags: [],
    weeklyReviewDay: 0,
    weeklyReviewTime: '18:00',
    privacyMode: 'ai_on'
  }),
  saveSettings: (settings: AppSettings) => set(KEYS.SETTINGS, settings),

  clearAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  },

  exportData: () => {
    const data: Record<string, any> = {};
    Object.entries(KEYS).forEach(([name, key]) => {
      const val = localStorage.getItem(key);
      data[name] = val ? JSON.parse(val) : null;
    });
    return JSON.stringify(data);
  },
  importData: (json: string) => {
    try {
      const data = JSON.parse(json);
      Object.entries(KEYS).forEach(([name, key]) => {
        if (data[name] !== undefined && data[name] !== null) {
          localStorage.setItem(key, JSON.stringify(data[name]));
        }
      });
      window.location.reload();
    } catch (e) {
      console.error("Import failed", e);
      alert("Invalid backup file. Please ensure it is a valid CRIPES JSON backup.");
    }
  }
};
