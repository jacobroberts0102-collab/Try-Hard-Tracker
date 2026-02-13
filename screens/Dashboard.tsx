
import React from 'react';
import { TrendingUp, Zap, ChevronRight, CheckCircle2, BookOpen, Clock, Sun, Sunset, Moon, User as UserIcon } from 'lucide-react';
import { Habit, HabitCompletion, AppSettings, TimeOfDay } from '../types';

interface DashboardProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onComplete: (id: string, type: 'primary' | 'backup') => void;
  onNavigate: (s: string) => void;
  settings: AppSettings;
  theme: any;
}

const Dashboard: React.FC<DashboardProps> = ({ habits, completions, onNavigate, settings, theme, onComplete }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCompletions = completions.filter(c => c.localDate === today);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const activeHabits = habits.filter(h => !h.archived);
  const completionRate = activeHabits.length > 0 ? (todayCompletions.length / activeHabits.length) * 100 : 0;

  const getTimeIcon = (time?: TimeOfDay) => {
    switch (time) {
      case 'Morning': return <Sun size={10} />;
      case 'Afternoon': return <Sunset size={10} />;
      case 'Evening': return <Moon size={10} />;
      default: return <Clock size={10} />;
    }
  };

  return (
    <div className="flex flex-col" style={{ gap: 'var(--app-gap)' }}>
      {/* Enhanced Header Section */}
      <div className="flex justify-between items-center py-4 px-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: theme.text }}>
            {greeting}, <span style={{ color: theme.primary }}>{settings.displayName}</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-50" style={{ color: theme.muted }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        
        <button 
          onClick={() => onNavigate('settings')}
          className="relative group transition-all active:scale-90"
        >
          <div 
            className="w-14 h-14 rounded-[20px] border-2 shadow-2xl overflow-hidden flex items-center justify-center font-black transition-all border-transparent group-hover:scale-105"
            style={{ 
              backgroundColor: settings.avatar ? 'transparent' : theme.primary + '11',
              borderColor: theme.primary + '44'
            }}
          >
            {settings.avatar ? (
              <img src={settings.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-xl font-black"
                style={{ color: theme.primary, backgroundColor: theme.primary + '11' }}
              >
                {settings.displayName ? settings.displayName.charAt(0).toUpperCase() : <UserIcon size={24} />}
              </div>
            )}
          </div>
          {/* Subtle status dot */}
          <div 
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 flex items-center justify-center shadow-lg"
            style={{ backgroundColor: theme.primary, borderColor: theme.card }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </button>
      </div>

      {/* Progress Card */}
      <div className="app-card shadow-2xl border border-white/5" style={{ backgroundColor: theme.card }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: theme.muted }}>
            <TrendingUp size={14} className="opacity-50" />
            Daily Momentum
          </h3>
          <div className="px-3 py-1 rounded-full text-[10px] font-black" style={{ backgroundColor: theme.primary + '22', color: theme.primary }}>
            {Math.round(completionRate)}%
          </div>
        </div>

        <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden mb-6">
          <div 
            className="h-full transition-all duration-700 ease-out"
            style={{ width: `${completionRate}%`, backgroundColor: theme.primary }}
          />
        </div>
        
        <div className="space-y-3">
          {activeHabits.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed rounded-3xl opacity-40" style={{ borderColor: theme.muted + '44' }}>
              <p style={{ color: theme.muted }} className="text-xs font-bold">Your journey starts here.</p>
              <button onClick={() => onNavigate('habits')} className="mt-2 font-black text-[10px] uppercase tracking-[0.2em]" style={{ color: theme.primary }}>+ Add First Habit</button>
            </div>
          ) : (
            activeHabits.slice(0, 5).map(habit => {
              const comp = todayCompletions.find(c => c.habitId === habit.id);
              return (
                <div key={habit.id} className="flex items-center gap-4 group">
                  <button 
                    onClick={() => onComplete(habit.id, 'primary')}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all active:scale-90 ${
                      comp?.completedType === 'primary' ? 'shadow-lg' : 'hover:border-indigo-500/50'
                    }`}
                    style={{ 
                      backgroundColor: comp?.completedType === 'primary' ? theme.primary : 'transparent',
                      borderColor: comp?.completedType === 'primary' ? theme.primary : theme.muted + '22',
                      color: comp?.completedType === 'primary' ? '#fff' : theme.muted
                    }}
                  >
                    {comp?.completedType === 'primary' ? <CheckCircle2 size={20} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.muted + '44' }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate transition-all ${comp ? 'opacity-30 line-through' : ''}`} style={{ color: theme.text }}>{habit.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1" style={{ color: theme.muted }}>
                        {getTimeIcon(habit.timeOfDay)} {habit.timeOfDay || 'Anytime'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Journal Link */}
      <button 
        onClick={() => onNavigate('journal')}
        className="app-card shadow-xl flex items-center gap-5 transition-all active:scale-[0.98] text-left w-full border border-white/5"
        style={{ backgroundColor: theme.card }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6" style={{ backgroundColor: theme.primary + '11', color: theme.primary }}>
          <BookOpen size={22} />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-sm" style={{ color: theme.text }}>Daily Reflection</h4>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1" style={{ color: theme.muted }}>Capture the signal</p>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5" style={{ color: theme.muted }}>
          <ChevronRight size={16} />
        </div>
      </button>

      {/* AI Insight Card */}
      <div className="app-card shadow-lg border border-transparent overflow-hidden relative" style={{ backgroundColor: theme.card }}>
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Zap size={80} style={{ color: theme.primary }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="fill-current" style={{ color: theme.primary }} />
            <h4 className="font-black text-[9px] uppercase tracking-[0.25em]" style={{ color: theme.muted }}>Cripes Protocol</h4>
          </div>
          <p className="text-xs leading-relaxed font-bold italic" style={{ color: theme.text }}>
            "The secret of your future is hidden in your daily routine." You're building a stronger foundation with every check-in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
