
import React, { useState, useMemo } from 'react';
import { BookOpen, Sparkles, Send, Plus, Edit3, Trash2, X, History, ChevronLeft, Layout, Check, Hash, Type as TypeIcon, ListOrdered, Search, ChevronRight } from 'lucide-react';
import { JournalTemplate, JournalEntry, JournalField, JournalFieldType } from '../types';
import { db } from '../db';
import { geminiService } from '../geminiService';

interface JournalScreenProps {
  templates: JournalTemplate[];
  entries: JournalEntry[];
  onRefresh: () => void;
  theme: any;
}

type JournalView = 'list' | 'entry' | 'manage' | 'edit_template' | 'history' | 'view_entry';

const JournalScreen: React.FC<JournalScreenProps> = ({ templates, entries, onRefresh, theme }) => {
  const [view, setView] = useState<JournalView>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<JournalTemplate> | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const startEntry = (t: JournalTemplate) => {
    setSelectedTemplate(t);
    setView('entry');
    setFormData({});
    setCurrentFieldIndex(0);
  };

  const startNewTemplate = () => {
    setEditingTemplate({
      id: crypto.randomUUID(),
      name: '',
      fields: [
        { id: crypto.randomUUID(), key: 'mood', label: 'How are you feeling?', type: 'slider', required: true, sliderMin: 1, sliderMax: 10 }
      ],
      suggestedFields: [],
      archived: false,
      createdAtISO: new Date().toISOString(),
      updatedAtISO: new Date().toISOString()
    });
    setView('edit_template');
  };

  const editTemplate = (t: JournalTemplate) => {
    setEditingTemplate({ ...t });
    setView('edit_template');
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate || !editingTemplate.name) {
      alert("Please enter a template name");
      return;
    }
    db.saveTemplate(editingTemplate as JournalTemplate);
    setView('manage');
    setEditingTemplate(null);
    onRefresh();
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Archive this template? It will no longer appear in your active list.")) {
      const t = templates.find(temp => temp.id === id);
      if (t) {
        db.saveTemplate({ ...t, archived: true });
        onRefresh();
      }
    }
  };

  const handleDeleteEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this journal entry? This cannot be undone.")) {
      db.deleteEntry(id);
      onRefresh();
    }
  };

  const handleSubmitEntry = async () => {
    if (!selectedTemplate) return;
    setLoading(true);

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      localDate: new Date().toISOString().split('T')[0],
      createdAtISO: new Date().toISOString(),
      templateId: selectedTemplate.id,
      tags: [],
      mood: formData.mood || 5,
      data: formData,
    };

    const feedback = await geminiService.generateDailyFeedback(entry, db.getCompletions(), db.getHabits());
    entry.aiFeedback = feedback;

    db.saveEntry(entry);
    setLastFeedback(feedback || "Reflection saved.");
    setFormData({});
    setSelectedTemplate(null);
    setView('list');
    setLoading(false);
    onRefresh();
  };

  const addField = () => {
    if (!editingTemplate) return;
    const newField: JournalField = {
      id: crypto.randomUUID(),
      key: `field_${editingTemplate.fields?.length || 0}_${Date.now()}`,
      label: 'New Question',
      type: 'short_text',
      required: false
    };
    setEditingTemplate({
      ...editingTemplate,
      fields: [...(editingTemplate.fields || []), newField]
    });
  };

  const updateField = (fieldId: string, updates: Partial<JournalField>) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      fields: editingTemplate.fields?.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  const removeField = (fieldId: string) => {
    if (!editingTemplate) return;
    const fieldLabel = editingTemplate.fields?.find(f => f.id === fieldId)?.label || "this question";
    if (confirm(`Remove the question "${fieldLabel}" from this template?`)) {
      setEditingTemplate({
        ...editingTemplate,
        fields: editingTemplate.fields?.filter(f => f.id !== fieldId)
      });
    }
  };

  const filteredEntries = useMemo(() => {
    let sorted = [...entries].sort((a, b) => 
      new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()
    );

    if (!searchQuery.trim()) return sorted;

    const query = searchQuery.toLowerCase();
    return sorted.filter(entry => {
      // Search in AI Feedback
      if (entry.aiFeedback?.toLowerCase().includes(query)) return true;
      
      // Search in Journal data responses
      const dataValues = Object.values(entry.data).map(v => String(v).toLowerCase());
      if (dataValues.some(v => v.includes(query))) return true;

      // Search in Template Name
      const templateName = templates.find(t => t.id === entry.templateId)?.name.toLowerCase() || '';
      if (templateName.includes(query)) return true;

      return false;
    });
  }, [entries, searchQuery, templates]);

  const getTemplateName = (id: string) => templates.find(t => t.id === id)?.name || 'Entry';

  const currentField = selectedTemplate?.fields[currentFieldIndex];
  const isLastField = selectedTemplate && currentFieldIndex === selectedTemplate.fields.length - 1;

  const handleNext = () => {
    if (!selectedTemplate) return;
    if (currentField?.required && !formData[currentField.key]) {
      alert("This question is required.");
      return;
    }
    if (currentFieldIndex < selectedTemplate.fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black" style={{ color: theme.text }}>Journal</h1>
        <div className="flex gap-2">
          {view === 'list' && (
            <>
              <button 
                onClick={() => setView('history')}
                className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-2 rounded-xl transition-all active-scale flex items-center gap-1.5"
                style={{ backgroundColor: theme.card, color: theme.primary }}
              >
                <History size={14} /> History
              </button>
              <button 
                onClick={() => setView('manage')}
                className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-2 rounded-xl transition-all active-scale"
                style={{ backgroundColor: theme.card, color: theme.muted }}
              >
                Manage
              </button>
            </>
          )}
          {['manage', 'history', 'view_entry', 'edit_template'].includes(view) && (
            <button 
              onClick={() => {
                setView(view === 'edit_template' ? 'manage' : 'list');
                setSearchQuery('');
              }}
              className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-2 rounded-xl transition-all active-scale"
              style={{ backgroundColor: theme.card, color: theme.muted }}
            >
              Back
            </button>
          )}
          <BookOpen style={{ color: theme.primary }} />
        </div>
      </div>

      {view === 'list' && (
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: theme.muted }}>Ready to reflect?</h2>
          {templates.filter(t => !t.archived).map(t => (
            <button 
              key={t.id}
              onClick={() => startEntry(t)}
              className="w-full p-6 rounded-3xl shadow-xl border border-transparent flex justify-between items-center transition-all active-scale"
              style={{ backgroundColor: theme.card }}
            >
              <div className="text-left">
                <h3 className="font-bold text-lg" style={{ color: theme.text }}>{t.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60" style={{ color: theme.muted }}>{t.fields.length} questions</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: theme.primary, color: '#fff' }}>
                <Send size={20} />
              </div>
            </button>
          ))}

          {lastFeedback && (
            <div className="p-5 rounded-3xl shadow-2xl space-y-3 animate-in zoom-in duration-300 relative overflow-hidden" style={{ backgroundColor: theme.card }}>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} style={{ color: theme.primary }} />
                <h3 className="font-black text-[9px] uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Gemini Insight</h3>
              </div>
              <div className="text-xs font-medium leading-relaxed" style={{ color: theme.text }}>
                {lastFeedback.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('-') ? 'ml-2 mb-0.5' : 'mb-2 last:mb-0'}>{line}</p>
                ))}
              </div>
              <button 
                onClick={() => setLastFeedback(null)}
                className="w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active-scale"
                style={{ backgroundColor: theme.background, color: theme.muted }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'manage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Templates</h3>
            <button 
              onClick={startNewTemplate}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 active-scale transition-all shadow-lg"
              style={{ backgroundColor: theme.primary, color: '#fff' }}
            >
              <Plus size={14} /> New Template
            </button>
          </div>
          
          <div className="space-y-3">
            {templates.filter(t => !t.archived).map(t => (
              <div key={t.id} className="p-5 rounded-[24px] border border-transparent shadow-lg flex items-center gap-4 transition-all" style={{ backgroundColor: theme.card }}>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm truncate" style={{ color: theme.text }}>{t.name}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>{t.fields.length} questions</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => editTemplate(t)}
                    className="p-3 rounded-xl transition-all active-scale"
                    style={{ backgroundColor: theme.background, color: theme.primary }}
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="p-3 rounded-xl transition-all active-scale"
                    style={{ backgroundColor: '#EF444411', color: '#EF4444' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'edit_template' && editingTemplate && (
        <div className="space-y-6 pb-20 animate-in slide-in-from-bottom duration-500">
          <div className="p-6 rounded-3xl shadow-xl space-y-6" style={{ backgroundColor: theme.card }}>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Template Name</label>
              <input 
                className="w-full border-0 rounded-2xl p-4 mt-1 font-bold text-lg focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                style={{ backgroundColor: theme.background, color: theme.text }}
                placeholder="e.g. Evening Reflection"
                value={editingTemplate.name}
                onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.muted }}>Questions</h3>
                <button 
                  onClick={addField}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest active-scale"
                  style={{ backgroundColor: theme.primary + '11', color: theme.primary }}
                >
                  <Plus size={12} /> Add Field
                </button>
              </div>

              <div className="space-y-4">
                {editingTemplate.fields?.map((field, idx) => (
                  <div key={field.id} className="p-4 rounded-2xl border border-transparent space-y-4" style={{ backgroundColor: theme.background }}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <label className="text-[9px] font-black uppercase tracking-widest mb-1 block" style={{ color: theme.muted }}>Label</label>
                        <input 
                          className="w-full bg-transparent border-0 border-b-2 border-gray-100 p-0 pb-1 font-bold text-sm focus:ring-0 focus:border-indigo-500 transition-all"
                          style={{ color: theme.text }}
                          value={field.label}
                          onChange={e => updateField(field.id, { label: e.target.value })}
                        />
                      </div>
                      <button 
                        onClick={() => removeField(field.id)}
                        className="p-2 rounded-lg"
                        style={{ color: '#EF4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest mb-1 block" style={{ color: theme.muted }}>Type</label>
                        <select 
                          className="w-full bg-transparent border-0 font-bold text-xs p-0 focus:ring-0"
                          style={{ color: theme.primary }}
                          value={field.type}
                          onChange={e => updateField(field.id, { type: e.target.value as JournalFieldType })}
                        >
                          <option value="short_text">Short Text</option>
                          <option value="long_text">Long Text</option>
                          <option value="slider">Slider (1-10)</option>
                          <option value="number">Number</option>
                          <option value="yes_no">Yes/No</option>
                        </select>
                      </div>
                      <div className="flex items-end justify-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={field.required}
                            onChange={e => updateField(field.id, { required: e.target.checked })}
                          />
                          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>Required</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSaveTemplate}
              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active-scale transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.primary, color: '#fff' }}
            >
              <Check size={18} /> Save Template
            </button>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-4">
          <div className="sticky top-0 z-10 pt-2 pb-4" style={{ backgroundColor: theme.background }}>
             <div className="relative group">
                <input 
                  type="text"
                  placeholder="Search keywords in history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-0 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-lg"
                  style={{ backgroundColor: theme.card, color: theme.text }}
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: theme.text }} />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-200/50 hover:bg-gray-200 transition-colors"
                  >
                    <X size={14} style={{ color: theme.muted }} />
                  </button>
                )}
             </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              {searchQuery ? (
                <>
                  <Search size={64} className="mx-auto mb-4" />
                  <p className="font-bold">No matches found for "{searchQuery}"</p>
                </>
              ) : (
                <>
                  <BookOpen size={64} className="mx-auto mb-4" />
                  <p className="font-bold">No history yet.</p>
                </>
              )}
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div 
                key={entry.id}
                className="w-full p-5 rounded-3xl shadow-lg border border-transparent flex justify-between items-center transition-all active-scale"
                style={{ backgroundColor: theme.card }}
              >
                <div className="flex-1 text-left cursor-pointer" onClick={() => { setSelectedEntry(entry); setView('view_entry'); }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.primary }}>
                      {new Date(entry.createdAtISO).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold" style={{ color: theme.text }}>{getTemplateName(entry.templateId)}</h3>
                  {searchQuery && (
                    <p className="text-[10px] mt-1 line-clamp-1 opacity-60" style={{ color: theme.muted }}>
                      {entry.aiFeedback && entry.aiFeedback.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                        <span className="flex items-center gap-1"><Sparkles size={8} /> Matches AI feedback</span>
                      ) : (
                        "Matches response text"
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleDeleteEntry(e, entry.id)}
                    className="p-3 rounded-xl transition-all active-scale hover:bg-red-500/10"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronLeft size={18} className="rotate-180 opacity-40" style={{ color: theme.muted }} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'view_entry' && selectedEntry && (
        <div className="p-6 rounded-3xl shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-500" style={{ backgroundColor: theme.card }}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black" style={{ color: theme.text }}>{getTemplateName(selectedEntry.templateId)}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>{new Date(selectedEntry.createdAtISO).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setView('history')} style={{ color: theme.muted }}><X size={20}/></button>
          </div>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
            {templates.find(t => t.id === selectedEntry.templateId)?.fields.map(field => (
              <div key={field.id} className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>{field.label}</p>
                <div className="p-4 rounded-2xl text-xs font-bold leading-relaxed" style={{ backgroundColor: theme.background, color: theme.text }}>
                  {selectedEntry.data[field.key] || '---'}
                </div>
              </div>
            ))}
            {selectedEntry.aiFeedback && (
              <div className="pt-4 border-t border-gray-100/10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} style={{ color: theme.primary }} />
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>Gemini Reflection</p>
                </div>
                <div className="p-4 rounded-2xl text-xs italic font-medium leading-relaxed" style={{ backgroundColor: theme.primary + '11', color: theme.text }}>
                  {selectedEntry.aiFeedback}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setView('history')}
            className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active-scale"
            style={{ backgroundColor: theme.background, color: theme.text }}
          >
            Close Reflection
          </button>
        </div>
      )}

      {view === 'entry' && selectedTemplate && (
        <div className="p-6 rounded-3xl shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-500 flex flex-col h-full min-h-[420px]" style={{ backgroundColor: theme.card }}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black" style={{ color: theme.text }}>{selectedTemplate.name}</h2>
              <p className="text-[9px] font-black uppercase tracking-widest mt-1" style={{ color: theme.primary }}>
                Question {currentFieldIndex + 1} of {selectedTemplate.fields.length}
              </p>
            </div>
            <button onClick={() => setView('list')} style={{ color: theme.muted }} className="p-2 rounded-full hover:bg-black/5 active-scale"><X size={20}/></button>
          </div>

          <div className="flex-1 flex flex-col justify-center py-2">
            {currentField && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
                <label className="text-lg font-bold leading-tight block text-center" style={{ color: theme.text }}>
                  {currentField.label}
                  {currentField.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                <div className="w-full">
                  {currentField.type === 'long_text' && (
                    <textarea 
                      autoFocus
                      className="w-full border-0 rounded-2xl p-4 min-h-[160px] font-bold text-sm focus:ring-4 focus:ring-indigo-500/20 shadow-inner"
                      style={{ backgroundColor: theme.background, color: theme.text }}
                      placeholder="Type your reflection here..."
                      value={formData[currentField.key] || ''}
                      onChange={e => setFormData({ ...formData, [currentField.key]: e.target.value })}
                    />
                  )}
                  
                  {(currentField.type === 'short_text' || currentField.type === 'number') && (
                    <input 
                      autoFocus
                      type={currentField.type === 'number' ? 'number' : 'text'}
                      className="w-full border-0 rounded-2xl p-4 font-bold text-base focus:ring-4 focus:ring-indigo-500/20 shadow-inner"
                      style={{ backgroundColor: theme.background, color: theme.text }}
                      placeholder="Enter answer..."
                      value={formData[currentField.key] || ''}
                      onChange={e => setFormData({ ...formData, [currentField.key]: e.target.value })}
                    />
                  )}

                  {currentField.type === 'slider' && (
                    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl" style={{ backgroundColor: theme.background }}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl shadow-xl border-4" style={{ backgroundColor: theme.primary, color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
                        {formData[currentField.key] || 5}
                      </div>
                      <input 
                        type="range"
                        min={currentField.sliderMin || 1}
                        max={currentField.sliderMax || 10}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        style={{ background: theme.card }}
                        value={formData[currentField.key] || 5}
                        onChange={e => setFormData({ ...formData, [currentField.key]: parseInt(e.target.value) })}
                      />
                      <div className="flex justify-between w-full text-[9px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  )}

                  {currentField.type === 'yes_no' && (
                    <div className="flex flex-col gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setFormData({ ...formData, [currentField.key]: opt })}
                          className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active-scale ${
                            formData[currentField.key] === opt ? 'shadow-inner scale-[0.98]' : 'shadow-md'
                          }`}
                          style={{ 
                            backgroundColor: formData[currentField.key] === opt ? theme.primary : theme.background,
                            color: formData[currentField.key] === opt ? '#fff' : theme.muted,
                            border: formData[currentField.key] === opt ? 'none' : `1px solid ${theme.muted}22`
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
            <button 
              onClick={handleBack}
              disabled={currentFieldIndex === 0}
              className={`py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active-scale ${
                currentFieldIndex === 0 ? 'opacity-20 pointer-events-none' : 'shadow-lg'
              }`}
              style={{ backgroundColor: theme.background, color: theme.muted }}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {!isLastField ? (
              <button 
                onClick={handleNext}
                className="py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-1.5 transition-all active-scale"
                style={{ backgroundColor: theme.primary, color: '#fff' }}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                disabled={loading}
                onClick={handleSubmitEntry}
                className="py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-1.5 transition-all active-scale"
                style={{ backgroundColor: theme.primary, color: '#fff', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Wait...' : <><Send size={16} /> Finish</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalScreen;
