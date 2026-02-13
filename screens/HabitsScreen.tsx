
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, X, History, CheckCircle2, Sun, Sunset, Moon, CalendarDays, Bell, Edit2, Zap } from 'lucide-react';
import { Habit, HabitCompletion, HabitFrequencyType, TimeOfDay } from '../types';
import { db } from '../db';

interface HabitsScreenProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onComplete: (id: string, type: 'primary' | 'backup') => void;
  onRefresh: () => void;
  theme: any;
}

const HabitsScreen: React.FC<HabitsScreenProps> = ({ habits, completions, onComplete, onRefresh, theme }) => {
  const [view, setView] = useState<'list' | 'history'>('list');
  const [showAdd, setShowAdd] = useState(false);
  const [categories, setCategories] = useState<string[]>(db.getCategories());
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  
  const initialHabitState: Partial<Habit> = {
    name: '',
    backupName: '',
    category: categories[0] || 'Physical',
    frequency: { type: 'daily' },
    timeOfDay: 'Anytime',
    reminderTime: '',
    archived: false,
  };

  const [newHabit, setNewHabit] = useState<Partial<Habit>>(initialHabitState);

  useEffect(() => {
    setCategories(db.getCategories());
  }, [showAdd]);

  const today = new Date().toISOString().split('T')[0];

  const handleOpenAdd = () => {
    setEditingHabitId(null);
    setNewHabit(initialHabitState);
    setShowAdd(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setNewHabit({ ...habit });
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!newHabit.name) return;
    const h: Habit = {
      id: editingHabitId || crypto.randomUUID(),
      name: newHabit.name,
      backupName: newHabit.backupName,
      category: newHabit.category || categories[0] || 'Physical',
      frequency: newHabit.frequency || { type: 'daily' },
      timeOfDay: newHabit.timeOfDay || 'Anytime',
      reminderTime: newHabit.reminderTime,
      archived: false,
      createdAtISO: newHabit.createdAtISO || new Date().toISOString(),
      updatedAtISO: new Date().toISOString(),
    };
    db.saveHabit(h);
    setShowAdd(false);
    setEditingHabitId(null);
    setNewHabit(initialHabitState);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this habit forever?")) {
      db.deleteHabit(id);
      onRefresh();
    }
  };

  const handleDeleteCompletion = (id: string) => {
    if (confirm("Remove this completion record?")) {
      db.deleteCompletionById(id);
      onRefresh();
    }
  };

  const getTimeIcon = (time?: TimeOfDay) => {
    switch (time) {
      case 'Morning': return <Sun size={12} />;
      case 'Afternoon': return <Sunset size={12} />;
      case 'Evening': return <Moon size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const sortedCompletions = [...completions].sort((a, b) => 
    new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()
  );

  const getHabitName = (id: string) => habits.find(h => h.id === id)?.name || 'Deleted Habit';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black" style={{ color: theme.text }}>Habits</h1>
        <div className="flex gap-2">
          {view === 'list' ? (
            <button 
              onClick={() => setView('history')}
              className="text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl active-scale flex items-center gap-1.5 shadow-sm"
              style={{ backgroundColor: theme.card, color: theme.primary }}
            >
              <History size={14} /> History
            </button>
          ) : (
            <button 
              onClick={() => setView('list')}
              className="text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl active-scale"
              style={{ backgroundColor: theme.card, color: theme.muted }}
            >
              Back
            </button>
          )}
          <button 
            onClick={handleOpenAdd}
            className="p-3 rounded-2xl shadow-xl active-scale transition-all"
            style={{ backgroundColor: theme.primary, color: '#fff' }}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {view === 'list' && (
        <div className="space-y-4">
          {habits.filter(h => !h.archived).map(habit => {
            const comp = completions.find(c => c.habitId === habit.id && c.localDate === today);
            return (
              <div key={habit.id} className="p-5 rounded-3xl shadow-lg border border-transparent transition-all" style={{ backgroundColor: theme.card }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-lg" style={{ backgroundColor: theme.background, color: theme.primary }}>
                        {habit.category}
                      </span>
                      <span className="text-[9px] flex items-center gap-1 uppercase font-black tracking-widest px-2 py-1 rounded-lg" style={{ backgroundColor: theme.background, color: theme.muted }}>
                        {getTimeIcon(habit.timeOfDay)} {habit.timeOfDay || 'Anytime'}
                      </span>
                      {habit.reminderTime && (
                        <span className="text-[9px] flex items-center gap-1 uppercase font-black tracking-widest px-2 py-1 rounded-lg" style={{ backgroundColor: theme.primary + '11', color: theme.primary }}>
                          <Bell size={10} /> {habit.reminderTime}
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold text-base transition-all ${comp ? 'opacity-30 line-through' : ''}`} style={{ color: theme.text }}>{habit.name}</h3>
                    {habit.backupName && (
                      <p className="text-[10px] font-bold mt-1 opacity-60 flex items-center gap-1" style={{ color: theme.muted }}>
                        <Zap size={10} className="text-orange-400 fill-orange-400" /> Backup: {habit.backupName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEdit(habit)} 
                      className="p-3 rounded-xl transition-all active-scale hover:bg-indigo-500/10" 
                      style={{ color: theme.primary }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(habit.id)} 
                      className="p-3 -mr-2 rounded-xl transition-all active-scale hover:bg-red-500/10" 
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => onComplete(habit.id, 'primary')}
                    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active-scale ${
                      comp?.completedType === 'primary' ? 'shadow-inner' : 'shadow-lg'
                    }`}
                    style={{ 
                      backgroundColor: comp?.completedType === 'primary' ? theme.primary + '22' : theme.primary,
                      color: comp?.completedType === 'primary' ? theme.primary : '#fff',
                      border: comp?.completedType === 'primary' ? `1px solid ${theme.primary}` : 'none'
                    }}
                  >
                    {comp?.completedType === 'primary' ? 'Completed' : 'Primary'}
                  </button>
                  {habit.backupName && (
                    <button 
                      onClick={() => onComplete(habit.id, 'backup')}
                      className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active-scale ${
                        comp?.completedType === 'backup' ? 'shadow-inner' : 'shadow-md'
                      }`}
                      style={{ 
                        backgroundColor: comp?.completedType === 'backup' ? '#f59e0b22' : theme.background,
                        color: comp?.completedType === 'backup' ? '#f59e0b' : theme.muted,
                        border: comp?.completedType === 'backup' ? '1px solid #f59e0b' : `1px solid ${theme.muted}22`
                      }}
                    >
                      {comp?.completedType === 'backup' ? 'Done (Backup)' : 'Backup'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-4">
          {sortedCompletions.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <History size={64} className="mx-auto mb-4" />
              <p className="font-bold">No history yet.</p>
            </div>
          ) : (
            sortedCompletions.map(comp => (
              <div key={comp.id} className="p-5 rounded-3xl shadow-lg border border-transparent flex items-center justify-between transition-all" style={{ backgroundColor: theme.card }}>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: theme.background, color: theme.primary }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: theme.text }}>{getHabitName(comp.habitId)}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>
                        {new Date(comp.createdAtISO).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: comp.completedType === 'primary' ? theme.primary : '#f59e0b' }}>
                        {comp.completedType}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteCompletion(comp.id)}
                  className="p-3 rounded-xl active-scale transition-all hover:bg-red-500/10"
                  style={{ color: '#EF4444' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-[100] animate-in fade-in duration-300 p-2 sm:p-4">
          <div className="w-full max-w-md rounded-3xl p-5 space-y-4 slide-in-from-bottom duration-300 shadow-2xl max-h-[95vh] overflow-y-auto no-scrollbar" style={{ backgroundColor: theme.card }}>
            <div className="flex justify-between items-center sticky top-0 pb-2 z-10" style={{ backgroundColor: theme.card }}>
              <h2 className="text-xl font-black" style={{ color: theme.text }}>{editingHabitId ? 'Edit Habit' : 'New Habit'}</h2>
              <button onClick={() => setShowAdd(false)} className="p-2" style={{ color: theme.muted }}><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Habit Name</label>
                <input 
                  autoFocus
                  className="w-full border-0 rounded-xl p-3.5 mt-1 font-bold text-base focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  style={{ backgroundColor: theme.background, color: theme.text }}
                  placeholder="e.g. Drink Water"
                  value={newHabit.name}
                  onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Backup Version (The "Tiny" Version)</label>
                <input 
                  className="w-full border-0 rounded-xl p-3.5 mt-1 font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  style={{ backgroundColor: theme.background, color: theme.text }}
                  placeholder="e.g. 1 small sip"
                  value={newHabit.backupName}
                  onChange={e => setNewHabit({ ...newHabit, backupName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Category</label>
                  <select 
                    className="w-full border-0 rounded-xl p-3.5 mt-1 font-bold text-xs focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm"
                    style={{ backgroundColor: theme.background, color: theme.text }}
                    value={newHabit.category}
                    onChange={e => setNewHabit({ ...newHabit, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Frequency</label>
                  <select 
                    className="w-full border-0 rounded-xl p-3.5 mt-1 font-bold text-xs focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm"
                    style={{ backgroundColor: theme.background, color: theme.text }}
                    value={newHabit.frequency?.type}
                    onChange={e => setNewHabit({ ...newHabit, frequency: { type: e.target.value as HabitFrequencyType } })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.muted }}>Scheduling</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Time of Day</label>
                    <div className="grid grid-cols-4 sm:grid-cols-2 gap-1.5 mt-1">
                      {(['Morning', 'Afternoon', 'Evening', 'Anytime'] as TimeOfDay[]).map(time => (
                        <button
                          key={time}
                          onClick={() => setNewHabit({ ...newHabit, timeOfDay: time })}
                          className="py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all active-scale"
                          style={{ 
                            backgroundColor: newHabit.timeOfDay === time ? theme.primary + '11' : theme.background,
                            borderColor: newHabit.timeOfDay === time ? theme.primary : 'transparent',
                            color: newHabit.timeOfDay === time ? theme.primary : theme.muted
                          }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Daily Reminder</label>
                    <div className="relative mt-1">
                      <input 
                        type="time"
                        className="w-full border-0 rounded-xl p-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm"
                        style={{ backgroundColor: theme.background, color: theme.text }}
                        value={newHabit.reminderTime || ''}
                        onChange={e => setNewHabit({ ...newHabit, reminderTime: e.target.value })}
                      />
                      <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.muted }} />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active-scale transition-all"
                style={{ backgroundColor: theme.primary, color: '#fff' }}
              >
                {editingHabitId ? 'Update Habit' : 'Create Habit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsScreen;
