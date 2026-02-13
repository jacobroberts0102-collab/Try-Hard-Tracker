
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  BookOpen, 
  BarChart3, 
  Settings,
  Bell,
  X
} from 'lucide-react';
import { db } from './db';
import { 
  Habit, HabitCompletion, JournalTemplate, JournalEntry, 
  AppSettings, CompletionType 
} from './types';
import { THEMES } from './constants';

// --- Screens ---
import Dashboard from './screens/Dashboard';
import HabitsScreen from './screens/HabitsScreen';
import JournalScreen from './screens/JournalScreen';
import ReviewScreen from './screens/ReviewScreen';
import SettingsScreen from './screens/SettingsScreen';

declare const confetti: any;

const RAINBOW_COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

const BottomNav = ({ current, onNavigate, theme }: { current: string, onNavigate: (s: string) => void, theme: any }) => {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'habits', icon: CheckCircle2, label: 'Habits' },
    { id: 'journal', icon: BookOpen, label: 'Journal' },
    { id: 'review', icon: BarChart3, label: 'Review' },
    { id: 'settings', icon: Settings, label: 'More' },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-16 pb-safe z-50 shadow-2xl"
      style={{ backgroundColor: theme.card, borderColor: 'rgba(255,255,255,0.05)' }}
    >
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center justify-center space-y-1 transition-all active:scale-90 ${
            current === item.id ? 'text-indigo-400' : 'text-gray-500'
          }`}
          style={{ color: current === item.id ? theme.primary : theme.muted }}
        >
          <item.icon size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());
  const [activeNotification, setActiveNotification] = useState<Habit | null>(null);
  
  const notifiedHabitIdsRef = useRef<Set<string>>(new Set());
  const lastDateRef = useRef<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    refreshData();
    if (settings.remindersEnabled && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Sync with Service Worker for background notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const activeReminders = habits
        .filter(h => !h.archived && h.reminderTime)
        .map(h => ({ id: h.id, name: h.name, time: h.reminderTime }));
      
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_REMINDERS',
        reminders: activeReminders
      });
    }
  }, [habits, settings.remindersEnabled]);

  useEffect(() => {
    const checkReminders = () => {
      if (!settings.remindersEnabled) return;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      if (today !== lastDateRef.current) {
        notifiedHabitIdsRef.current.clear();
        lastDateRef.current = today;
      }
      const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      habits.forEach(habit => {
        if (!habit.reminderTime || habit.archived) return;
        if (habit.reminderTime === currentHHmm && !notifiedHabitIdsRef.current.has(habit.id)) {
          const alreadyDone = completions.some(c => c.habitId === habit.id && c.localDate === today);
          if (!alreadyDone) {
            notifiedHabitIdsRef.current.add(habit.id);
            setActiveNotification(habit);
            if ("Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(`Habit Reminder`, {
                  body: `Don't forget: ${habit.name}`,
                  icon: settings.avatar || undefined,
                  tag: habit.id,
                  requireInteraction: true
                });
              } catch (err) {
                console.warn("System notification failed", err);
              }
            }
          }
        }
      });
    };
    const interval = setInterval(checkReminders, 30000);
    checkReminders();
    return () => clearInterval(interval);
  }, [habits, completions, settings]);

  const refreshData = () => {
    setHabits(db.getHabits());
    setCompletions(db.getCompletions());
    setTemplates(db.getTemplates());
    setEntries(db.getEntries());
    setSettings(db.getSettings());
  };

  const handleCompleteHabit = (habitId: string, type: CompletionType) => {
    const today = new Date().toISOString().split('T')[0];
    const exists = completions.find(c => c.habitId === habitId && c.localDate === today);
    if (exists) {
      db.removeCompletion(habitId, today);
    } else {
      const completion: HabitCompletion = {
        id: crypto.randomUUID(),
        habitId,
        localDate: today,
        completedType: type,
        createdAtISO: new Date().toISOString(),
        tzOffsetMinutes: new Date().getTimezoneOffset()
      };
      db.addCompletion(completion);
      if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: RAINBOW_COLORS });
      }
    }
    refreshData();
  };

  const currentTheme = useMemo(() => {
    const base = { ...THEMES[settings.theme] };
    if (settings.accentColorOverride) {
      base.primary = settings.accentColorOverride;
    }
    return base;
  }, [settings.theme, settings.accentColorOverride]);

  const cssVariables = useMemo(() => {
    let paddingOuter = '0.75rem';
    let paddingInner = '1.25rem';
    let gap = '1.25rem';
    let radius = '1.75rem';

    if (settings.layoutDensity === 'compact') {
      paddingOuter = '0.4rem';
      paddingInner = '0.65rem';
      gap = '0.65rem';
      radius = '0.85rem';
    } else if (settings.layoutDensity === 'roomy') {
      paddingOuter = '1.5rem';
      paddingInner = '2.25rem';
      gap = '2.25rem';
      radius = '3.5rem';
    }

    const fontFamily = settings.fontFamily === 'System' 
      ? 'system-ui, -apple-system, sans-serif' 
      : `"${settings.fontFamily}", system-ui, sans-serif`;

    return {
      '--app-padding-outer': paddingOuter,
      '--app-padding-inner': paddingInner,
      '--app-gap': gap,
      '--app-radius': radius,
      '--app-font': fontFamily,
      '--app-scale': settings.fontScale.toString(),
      '--app-primary': currentTheme.primary,
    };
  }, [settings.layoutDensity, settings.fontFamily, settings.fontScale, currentTheme]);

  return (
    <div 
      className="min-h-screen flex flex-col no-scrollbar transition-all duration-300"
      style={{ 
        backgroundColor: currentTheme.background, 
        color: currentTheme.text,
        ...cssVariables as any
      }}
    >
      <style>{`
        :root {
          ${Object.entries(cssVariables).map(([k, v]) => `${k}: ${v};`).join('\n')}
        }
        html {
          font-size: calc(16px * var(--app-scale));
        }
        body {
          font-family: var(--app-font);
        }
      `}</style>

      {activeNotification && (
        <div 
          className="fixed top-4 left-4 right-4 z-[100] p-4 rounded-3xl shadow-2xl border-2 flex items-center gap-4 animate-in slide-in-from-top duration-300"
          style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.primary }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: currentTheme.primary, color: '#fff' }}>
            <Bell size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Habit Reminder</p>
            <p className="text-base font-bold">{activeNotification.name}</p>
          </div>
          <button 
            onClick={() => setActiveNotification(null)}
            className="p-3 rounded-xl hover:bg-black/5"
            style={{ color: currentTheme.muted }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      <main className="flex-1 pb-24 w-full max-w-md mx-auto overflow-y-auto no-scrollbar app-container flex flex-col">
        {screen === 'dashboard' && (
          <Dashboard 
            habits={habits}
            completions={completions}
            onComplete={handleCompleteHabit}
            onNavigate={setScreen}
            settings={settings}
            theme={currentTheme}
          />
        )}
        {screen === 'habits' && (
          <HabitsScreen 
            habits={habits}
            completions={completions}
            onComplete={handleCompleteHabit}
            onRefresh={refreshData}
            theme={currentTheme}
          />
        )}
        {screen === 'journal' && (
          <JournalScreen 
            templates={templates}
            entries={entries}
            onRefresh={refreshData}
            theme={currentTheme}
          />
        )}
        {screen === 'review' && (
          <ReviewScreen 
            habits={habits}
            completions={completions}
            entries={entries}
            onRefresh={refreshData}
            theme={currentTheme}
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen 
            settings={settings} 
            onUpdateSettings={(s) => {
              db.saveSettings(s);
              refreshData();
            }}
            theme={currentTheme}
          />
        )}
      </main>

      <BottomNav current={screen} onNavigate={setScreen} theme={currentTheme} />
    </div>
  );
}
