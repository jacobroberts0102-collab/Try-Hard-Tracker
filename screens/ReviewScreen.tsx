
import React, { useState } from 'react';
import { BarChart3, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { Habit, HabitCompletion, JournalEntry } from '../types';
import { geminiService } from '../geminiService';
import { db } from '../db';

interface ReviewScreenProps {
  habits: Habit[];
  completions: HabitCompletion[];
  entries: JournalEntry[];
  onRefresh: () => void;
  theme: any;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ habits, completions, entries, onRefresh, theme }) => {
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const categories = db.getCategories();

  const handleRunAnalysis = async () => {
    setLoading(true);
    const analysis = await geminiService.analyzeWeeklyTrends(habits, completions, entries);
    setWeeklyAnalysis(analysis);
    setLoading(false);
  };

  const completionsCount = completions.length;
  const entriesCount = entries.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black" style={{ color: theme.text }}>Review</h1>
        <BarChart3 style={{ color: theme.primary }} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl shadow-lg border border-transparent" style={{ backgroundColor: theme.card }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: theme.muted }}>Total Habits</p>
          <p className="text-3xl font-black" style={{ color: theme.text }}>{completionsCount}</p>
        </div>
        <div className="p-6 rounded-3xl shadow-lg border border-transparent" style={{ backgroundColor: theme.card }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: theme.muted }}>Journals</p>
          <p className="text-3xl font-black" style={{ color: theme.text }}>{entriesCount}</p>
        </div>
      </div>

      <div className="p-6 rounded-[32px] shadow-xl space-y-6" style={{ backgroundColor: theme.card }}>
        <h3 className="font-bold text-lg" style={{ color: theme.text }}>Category Summary</h3>
        <div className="space-y-4">
          {categories.map(cat => {
            const catHabits = habits.filter(h => h.category === cat);
            const catComps = completions.filter(c => catHabits.some(h => h.id === c.habitId));
            const score = catHabits.length > 0 ? (catComps.length / (catHabits.length * 7)) * 100 : 0;
            return (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span style={{ color: theme.muted }}>{cat}</span>
                  <span style={{ color: theme.primary }}>{Math.round(score)}%</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: theme.background }}>
                  <div 
                    className="h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(score, 100)}%`, backgroundColor: theme.primary }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[40px] p-8 shadow-2xl space-y-6 relative overflow-hidden" style={{ backgroundColor: theme.primary, color: '#fff' }}>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg">Growth Intelligence</h3>
              <p className="text-[10px] text-white/70 uppercase font-black tracking-widest">Powered by Gemini</p>
            </div>
          </div>

          {weeklyAnalysis ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium text-white">{weeklyAnalysis}</pre>
              <button 
                onClick={() => setWeeklyAnalysis(null)}
                className="w-full py-4 bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/30 transition-all active:scale-95"
              >
                Clear Results
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-6">
              <p className="text-sm font-medium text-white/90">Run AI analysis to find patterns in your recent habits and journal entries.</p>
              <button 
                disabled={loading}
                onClick={handleRunAnalysis}
                className="bg-white px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-2 mx-auto active:scale-95 transition-all w-full"
                style={{ color: theme.primary }}
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                {loading ? 'Analyzing...' : 'Generate Analysis'}
              </button>
            </div>
          )}
        </div>
        <Zap className="absolute -bottom-6 -right-6 opacity-10 text-white" size={160} />
      </div>
    </div>
  );
};

export default ReviewScreen;
