
import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, User, Palette, Brain, Download, 
  Trash2, Camera, Check, Save, Plus, 
  Hash, Edit2, X, Maximize2, Type, Paintbrush,
  Upload, BellRing, BellOff, AlertCircle, Play
} from 'lucide-react';
import { AppSettings, ThemeName, LayoutDensity, FontFamily } from '../types';
import { db } from '../db';
import { THEMES } from '../constants';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  theme: any;
}

const ACCENT_COLORS = [
  { name: 'Indigo', value: '#818CF8' },
  { name: 'Teal', value: '#10B981' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Slate', value: '#475569' },
];

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onUpdateSettings, theme }) => {
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [categories, setCategories] = useState<string[]>(db.getCategories());
  const [newCatName, setNewCatName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [notifPermission, setNotifPermission] = useState<string>(
    "Notification" in window ? Notification.permission : 'unsupported'
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Sync permission status on focus or when settings change
  useEffect(() => {
    const checkPermission = () => {
      if ("Notification" in window) {
        setNotifPermission(Notification.permission);
      }
    };
    
    window.addEventListener('focus', checkPermission);
    checkPermission();
    return () => window.removeEventListener('focus', checkPermission);
  }, [settings.remindersEnabled]);

  const handleExport = () => {
    const data = db.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cripes_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const sendTestNotif = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("CRIPES Test", {
        body: "This is a sample reminder. Your habit 'Hydrate' is due now!",
        icon: draft.avatar || 'https://cdn-icons-png.flaticon.com/512/4345/4345512.png'
      });
    } else {
      alert("Please grant notification permissions first.");
    }
  };

  const requestNotifs = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    try {
      // Some browsers return the result, others use a callback. Modern ones return a promise.
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      
      if (permission === 'granted') {
        // Automatically enable the toggle if they just granted it
        handleUpdate({ remindersEnabled: true });
      } else if (permission === 'denied') {
        alert("Notifications are blocked in your browser settings. Please unblock them to receive habit reminders.");
      }
    } catch (err) {
      console.error("Error requesting notifications:", err);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (window.confirm("CRITICAL: This will overwrite ALL current data. Continue?")) {
          db.importData(content);
        }
      };
      reader.readAsText(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraft(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = (updates: Partial<AppSettings>) => {
    const next = { ...draft, ...updates };
    setDraft(next);
    
    // Auto-save logic: settings that should update the UI/System immediately
    const immediateKeys = [
      'theme', 'layoutDensity', 'fontFamily', 
      'accentColorOverride', 'fontScale', 'remindersEnabled'
    ];
    
    if (Object.keys(updates).some(k => immediateKeys.includes(k))) {
      onUpdateSettings(next);
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    onUpdateSettings(draft);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (name && !categories.includes(name)) {
      const newList = [...categories, name];
      setCategories(newList);
      db.saveCategories(newList);
      setNewCatName('');
    }
  };

  const startEditingCategory = (idx: number, name: string) => {
    setEditingIndex(idx);
    setEditCatName(name);
  };

  const saveCategoryEdit = (idx: number) => {
    const name = editCatName.trim();
    if (name && (name === categories[idx] || !categories.includes(name))) {
      const newList = [...categories];
      newList[idx] = name;
      setCategories(newList);
      db.saveCategories(newList);
      setEditingIndex(null);
    }
  };

  const removeCategory = (idx: number) => {
    const catName = categories[idx];
    if (window.confirm(`Delete the "${catName}" category?`)) {
      const newList = categories.filter((_, i) => i !== idx);
      setCategories(newList);
      db.saveCategories(newList);
    }
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-32">
        <div className="flex justify-between items-center px-2">
          <h1 className="text-2xl font-black" style={{ color: theme.text }}>Settings</h1>
          <Settings style={{ color: theme.primary }} />
        </div>

        <div className="space-y-4">
          {/* Profile Section */}
          <div className="app-card shadow-xl space-y-4" style={{ backgroundColor: theme.card }}>
            <div className="flex items-center gap-2 mb-1">
              <User size={16} style={{ color: theme.muted }} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Profile</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full border-4 shadow-xl overflow-hidden flex items-center justify-center transition-transform active:scale-95" style={{ backgroundColor: theme.background, borderColor: theme.card }}>
                  {draft.avatar ? (
                    <img src={draft.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} style={{ color: theme.muted }} />
                  )}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 p-1.5 rounded-xl shadow-2xl active-scale" style={{ backgroundColor: theme.primary, color: '#fff' }}>
                  <Camera size={14} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Display Name</label>
                <input className="w-full border-0 rounded-xl p-3 mt-1 font-bold text-sm shadow-sm" style={{ backgroundColor: theme.background, color: theme.text }} value={draft.displayName} onChange={e => setDraft({ ...draft, displayName: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Notifications Status */}
          <div className="app-card shadow-xl space-y-4" style={{ backgroundColor: theme.card }}>
            <div className="flex items-center gap-2 mb-1">
              <BellRing size={16} style={{ color: theme.muted }} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Notifications</h3>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: theme.background }}>
                <div className="flex items-center gap-3">
                  {notifPermission === 'granted' ? (
                    <BellRing size={20} className="text-green-500" />
                  ) : notifPermission === 'denied' ? (
                    <BellOff size={20} className="text-red-400" />
                  ) : (
                    <AlertCircle size={20} className="text-yellow-500 opacity-50" />
                  )}
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: theme.text }}>
                      {notifPermission === 'granted' ? 'Enabled' : notifPermission === 'denied' ? 'Blocked' : 'Action Required'}
                    </p>
                    <p className="text-[9px] font-bold opacity-60" style={{ color: theme.muted }}>
                      {notifPermission === 'granted' 
                        ? 'Reminders will appear in background' 
                        : notifPermission === 'denied' 
                        ? 'Check site settings to unblock'
                        : 'Permit system-level alerts'}
                    </p>
                  </div>
                </div>
                {notifPermission !== 'granted' ? (
                  <button 
                    onClick={requestNotifs} 
                    className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-indigo-500 text-white shadow-lg active-scale"
                    style={{ backgroundColor: notifPermission === 'denied' ? theme.muted + '44' : theme.primary }}
                  >
                    {notifPermission === 'denied' ? 'Manual Fix' : 'Request'}
                  </button>
                ) : (
                  <button 
                    onClick={sendTestNotif}
                    className="p-3 rounded-xl transition-all active-scale"
                    style={{ backgroundColor: theme.primary + '11', color: theme.primary }}
                    title="Send Test Notification"
                  >
                    <Play size={16} />
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between px-2 pt-2 border-t" style={{ borderColor: theme.muted + '11' }}>
                 <div className="flex flex-col">
                   <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>System Reminders</label>
                   <p className="text-[8px] font-bold opacity-40 uppercase tracking-tighter" style={{ color: theme.muted }}>Toggle active habit alerts</p>
                 </div>
                 <button 
                  onClick={() => {
                    if (notifPermission !== 'granted' && !draft.remindersEnabled) {
                      requestNotifs();
                    } else {
                      handleUpdate({ remindersEnabled: !draft.remindersEnabled });
                    }
                  }}
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ backgroundColor: draft.remindersEnabled ? theme.primary : theme.muted + '44' }}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${draft.remindersEnabled ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>
            </div>
          </div>

          {/* Theme Library */}
          <div className="app-card shadow-xl space-y-4" style={{ backgroundColor: theme.card }}>
            <div className="flex items-center gap-2 mb-1">
              <Palette size={16} style={{ color: theme.muted }} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Theme Library</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THEMES) as ThemeName[]).map(t => {
                const tData = THEMES[t];
                const isSelected = draft.theme === t;
                return (
                  <button key={t} onClick={() => handleUpdate({ theme: t })} className={`relative p-4 rounded-2xl border-2 transition-all active-scale text-left ${isSelected ? 'shadow-xl' : 'opacity-70'}`} style={{ backgroundColor: tData.background, borderColor: isSelected ? tData.primary : 'transparent' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: tData.text }}>{t}</span>
                      {isSelected && <Check size={12} style={{ color: tData.primary }} />}
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tData.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tData.card, border: `1px solid ${tData.muted}44` }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tData.muted }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories Manager */}
          <div className="app-card shadow-xl space-y-4" style={{ backgroundColor: theme.card }}>
            <div className="flex items-center gap-2 mb-1">
              <Hash size={16} style={{ color: theme.muted }} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Manage Categories</h3>
            </div>
            <div className="flex gap-2">
              <input className="flex-1 border-0 rounded-xl p-3 font-bold text-xs shadow-inner" style={{ backgroundColor: theme.background, color: theme.text }} placeholder="Add new category..." value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} />
              <button onClick={addCategory} className="p-3 rounded-xl shadow-lg active-scale" style={{ backgroundColor: theme.primary, color: '#fff' }}><Plus size={16}/></button>
            </div>
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 px-3 rounded-xl border border-transparent transition-all" style={{ backgroundColor: theme.background }}>
                  {editingIndex === idx ? (
                    <div className="flex-1 flex gap-2">
                      <input autoFocus className="flex-1 bg-transparent border-b-2 font-bold text-xs focus:ring-0 outline-none" style={{ borderColor: theme.primary, color: theme.text }} value={editCatName} onChange={e => setEditCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveCategoryEdit(idx)} />
                      <button onClick={() => saveCategoryEdit(idx)} className="p-1.5 text-green-500 hover:scale-110"><Check size={16}/></button>
                      <button onClick={() => setEditingIndex(null)} className="p-1.5 text-gray-400 hover:scale-110"><X size={16}/></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-xs" style={{ color: theme.text }}>{cat}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditingCategory(idx, cat)} className="p-1.5 opacity-40 hover:opacity-100 transition-opacity" style={{ color: theme.primary }}><Edit2 size={14}/></button>
                        <button onClick={() => removeCategory(idx)} className="p-1.5 opacity-40 hover:opacity-100 transition-opacity" style={{ color: '#EF4444' }}><Trash2 size={14}/></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Layout Density Controls */}
          <div className="app-card shadow-xl space-y-4" style={{ backgroundColor: theme.card }}>
            <div className="flex items-center gap-2 mb-1">
              <Maximize2 size={16} style={{ color: theme.muted }} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Layout Density</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'comfortable', 'roomy'] as LayoutDensity[]).map(d => (
                <button key={d} onClick={() => handleUpdate({ layoutDensity: d })} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active-scale ${draft.layoutDensity === d ? 'shadow-lg' : ''}`} style={{ backgroundColor: draft.layoutDensity === d ? theme.primary + '11' : theme.background, borderColor: draft.layoutDensity === d ? theme.primary : 'transparent', color: draft.layoutDensity === d ? theme.primary : theme.muted }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Typography Controls */}
          <div className="app-card shadow-xl space-y-4" style={{ backgroundColor: theme.card }}>
            <div className="flex items-center gap-2 mb-1">
              <Type size={16} style={{ color: theme.muted }} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Typography</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: theme.muted }}>Font Family</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Inter', 'JetBrains Mono', 'Lora', 'System'] as FontFamily[]).map(f => (
                    <button key={f} onClick={() => handleUpdate({ fontFamily: f })} className={`py-3 px-2 rounded-xl text-[10px] font-bold border-2 transition-all active-scale ${draft.fontFamily === f ? 'shadow-md' : ''}`} style={{ fontFamily: f === 'System' ? 'sans-serif' : f, backgroundColor: draft.fontFamily === f ? theme.primary + '11' : theme.background, borderColor: draft.fontFamily === f ? theme.primary : 'transparent', color: draft.fontFamily === f ? theme.primary : theme.text }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Scale Factor</label>
                  <span className="text-[9px] font-black" style={{ color: theme.primary }}>{Math.round(draft.fontScale * 100)}%</span>
                </div>
                <input type="range" min="0.8" max="1.4" step="0.05" className="w-full accent-indigo-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={draft.fontScale} onChange={e => handleUpdate({ fontScale: parseFloat(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Accent Override */}
          <div className="app-card shadow-xl space-y-4" style={{ backgroundColor: theme.card }}>
            <div className="flex items-center gap-2 mb-1">
              <Paintbrush size={16} style={{ color: theme.muted }} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Accent Override</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map(c => (
                <button key={c.name} onClick={() => handleUpdate({ accentColorOverride: c.value })} className={`w-8 h-8 rounded-full border-4 transition-all active-scale ${(draft.accentColorOverride || theme.primary) === c.value ? 'scale-125 shadow-lg' : 'opacity-60'}`} style={{ backgroundColor: c.value, borderColor: (draft.accentColorOverride || theme.primary) === c.value ? 'white' : 'transparent' }} />
              ))}
              <button onClick={() => handleUpdate({ accentColorOverride: undefined })} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[8px] font-black uppercase transition-all ${!draft.accentColorOverride ? 'scale-125 border-indigo-500' : 'opacity-60 border-gray-300'}`} style={{ backgroundColor: theme.background, color: theme.text }}>Reset</button>
            </div>
          </div>

          {/* Maintenance */}
          <div className="app-card shadow-xl space-y-3" style={{ backgroundColor: theme.card }}>
            <div className="flex items-center gap-2 mb-1">
              <Download size={16} style={{ color: theme.muted }} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Data Tools</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button onClick={handleExport} className="w-full py-3 px-4 rounded-xl flex items-center justify-between font-bold text-[10px] uppercase tracking-widest" style={{ backgroundColor: theme.background, color: theme.text }}>
                Export JSON <Download size={14}/>
              </button>
              
              <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
              <button onClick={() => importInputRef.current?.click()} className="w-full py-3 px-4 rounded-xl flex items-center justify-between font-bold text-[10px] uppercase tracking-widest" style={{ backgroundColor: theme.background, color: theme.text }}>
                Import JSON <Upload size={14}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Global Actions Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button 
            onClick={handleSave} 
            disabled={saveStatus !== 'idle'} 
            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all active-scale glass-card" 
            style={{ 
              backgroundColor: saveStatus === 'saved' ? '#10B981CC' : theme.primary + 'EE', 
              color: '#fff', 
              opacity: saveStatus === 'saving' ? 0.7 : 1,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${theme.primary}44`
            }}
          >
            {saveStatus === 'saved' ? <Check size={18}/> : saveStatus === 'saving' ? 'Saving...' : <Save size={18}/>}
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? '' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
