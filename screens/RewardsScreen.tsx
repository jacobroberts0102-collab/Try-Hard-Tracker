
import React, { useState } from 'react';
import { Award, Zap, ChevronRight, Gift, Plus, Edit3, Trash2, X, Check, History, Clock } from 'lucide-react';
import { Reward, RewardRedemption } from '../types';
import { db } from '../db';

interface RewardsScreenProps {
  gamification: { xp: number; level: number; nextLevelXp: number };
  rewards: Reward[];
  redemptions: RewardRedemption[];
  onRefresh: () => void;
  onRedeem: (r: Reward) => void;
  theme: any;
}

const RewardsScreen: React.FC<RewardsScreenProps> = ({ gamification, rewards, redemptions, onRefresh, onRedeem, theme }) => {
  const [view, setView] = useState<'list' | 'manage' | 'history'>('list');
  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null);

  const handleSaveReward = () => {
    if (!editingReward || !editingReward.title || !editingReward.costXp) return;
    
    const reward: Reward = {
      id: editingReward.id || crypto.randomUUID(),
      title: editingReward.title,
      description: editingReward.description || '',
      costXp: Number(editingReward.costXp),
      active: editingReward.active ?? true,
      createdAtISO: editingReward.createdAtISO || new Date().toISOString(),
    };
    
    db.saveReward(reward);
    setEditingReward(null);
    onRefresh();
  };

  const handleDeleteReward = (id: string) => {
    if (confirm("Are you sure you want to remove this reward?")) {
      // Corrected to use db.deleteReward instead of direct localStorage call
      db.deleteReward(id);
      onRefresh();
    }
  };

  const getRewardTitle = (rewardId: string) => {
    const r = rewards.find(rw => rw.id === rewardId);
    return r ? r.title : 'Deleted Reward';
  };

  const sortedRedemptions = [...redemptions].sort((a, b) => 
    new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black" style={{ color: theme.text }}>XP & Rewards</h1>
        <div className="flex gap-1">
          {view === 'list' ? (
            <>
              <button 
                onClick={() => setView('history')}
                className="text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                style={{ backgroundColor: theme.card, color: theme.primary }}
              >
                <History size={14} /> History
              </button>
              <button 
                onClick={() => setView('manage')}
                className="text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl active:scale-95 transition-all"
                style={{ backgroundColor: theme.card, color: theme.muted }}
              >
                Manage
              </button>
            </>
          ) : (
            <button 
              onClick={() => setView('list')}
              className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl active:scale-95 transition-all"
              style={{ backgroundColor: theme.card, color: theme.muted }}
            >
              Back
            </button>
          )}
        </div>
      </div>

      {view === 'list' && (
        <>
          <div className="p-8 rounded-[32px] shadow-2xl flex items-center justify-between" style={{ backgroundColor: theme.card }}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: theme.muted }}>Current Balance</p>
              <div className="flex items-center gap-2">
                <Zap className="fill-orange-500 text-orange-500" size={28} />
                <h2 className="text-4xl font-black" style={{ color: theme.text }}>{gamification.xp} <span className="text-xl font-medium" style={{ color: theme.muted }}>XP</span></h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: theme.primary }}>Lvl {gamification.level}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: theme.muted }}>Available Rewards</h3>
            {rewards.filter(r => r.active).length === 0 && (
              <div className="text-center py-12 opacity-40">
                <Gift size={48} className="mx-auto mb-3" />
                <p className="text-sm font-bold">No active rewards.</p>
              </div>
            )}
            {rewards.filter(r => r.active).map(reward => {
              const canAfford = gamification.xp >= reward.costXp;
              return (
                <div key={reward.id} className="p-6 rounded-[32px] shadow-xl border border-transparent flex items-center gap-5 transition-all" style={{ backgroundColor: theme.card }}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${canAfford ? 'shadow-lg' : ''}`} 
                    style={{ 
                      backgroundColor: canAfford ? theme.primary + '22' : theme.background, 
                      color: canAfford ? theme.primary : theme.muted 
                    }}
                  >
                    <Gift size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-base truncate" style={{ color: canAfford ? theme.text : theme.muted }}>{reward.title}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: '#f59e0b' }}>{reward.costXp} XP</p>
                  </div>
                  <button 
                    onClick={() => onRedeem(reward)}
                    disabled={!canAfford}
                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      canAfford 
                        ? 'shadow-lg active:scale-90' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ 
                      backgroundColor: canAfford ? theme.primary : theme.background, 
                      color: canAfford ? '#fff' : theme.muted 
                    }}
                  >
                    Redeem
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-2">
            <History size={16} style={{ color: theme.primary }} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Redemption Logs</h3>
          </div>
          {sortedRedemptions.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <History size={64} className="mx-auto mb-4" />
              <p className="font-bold">No redemptions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRedemptions.map(red => (
                <div key={red.id} className="p-5 rounded-[24px] shadow-lg flex items-center justify-between" style={{ backgroundColor: theme.card }}>
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: theme.background, color: theme.primary }}>
                      <Award size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: theme.text }}>{getRewardTitle(red.rewardId)}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>
                          {new Date(red.createdAtISO).toLocaleDateString()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.muted }}>
                          {new Date(red.createdAtISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-orange-500 uppercase">-{red.costXp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'manage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Reward Catalog</h3>
            <button 
              onClick={() => setEditingReward({ title: '', costXp: 50, active: true })}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all shadow-lg"
              style={{ backgroundColor: theme.primary, color: '#fff' }}
            >
              <Plus size={14} /> Add New
            </button>
          </div>
          
          <div className="space-y-3">
            {rewards.map(reward => (
              <div key={reward.id} className={`p-5 rounded-[24px] border flex items-center gap-4 transition-all ${!reward.active && 'opacity-40 grayscale'}`} 
                style={{ backgroundColor: theme.card, borderColor: 'transparent' }}>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm truncate" style={{ color: theme.text }}>{reward.title}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">{reward.costXp} XP</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingReward(reward)}
                    className="p-3 rounded-xl transition-all active:scale-90"
                    style={{ backgroundColor: theme.background, color: theme.primary }}
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteReward(reward.id)}
                    className="p-3 rounded-xl transition-all active:scale-90"
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

      {editingReward && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-[100] animate-in fade-in duration-300 p-4">
          <div className="w-full max-w-md rounded-[40px] p-8 space-y-8 slide-in-from-bottom duration-500 shadow-2xl" style={{ backgroundColor: theme.card }}>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black" style={{ color: theme.text }}>{editingReward.id ? 'Edit Reward' : 'New Reward'}</h2>
              <button onClick={() => setEditingReward(null)} style={{ color: theme.muted }}><X size={24}/></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Reward Name</label>
                <input 
                  autoFocus
                  className="w-full border-0 rounded-2xl p-5 mt-1 font-bold text-lg focus:ring-2 focus:ring-indigo-500 transition-all"
                  style={{ backgroundColor: theme.background, color: theme.text }}
                  placeholder="e.g. Cheat Meal"
                  value={editingReward.title}
                  onChange={e => setEditingReward({ ...editingReward, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>XP Cost</label>
                  <input 
                    type="number"
                    className="w-full border-0 rounded-2xl p-5 mt-1 font-black text-orange-500 focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: theme.background }}
                    value={editingReward.costXp}
                    onChange={e => setEditingReward({ ...editingReward, costXp: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: theme.muted }}>Status</label>
                  <button 
                    onClick={() => setEditingReward({ ...editingReward, active: !editingReward.active })}
                    className="mt-1 h-full rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2"
                    style={{ 
                      backgroundColor: editingReward.active ? theme.primary + '11' : theme.background,
                      borderColor: editingReward.active ? theme.primary : 'transparent',
                      color: editingReward.active ? theme.primary : theme.muted
                    }}
                  >
                    {editingReward.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSaveReward}
                className="w-full py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                style={{ backgroundColor: theme.primary, color: '#fff' }}
              >
                <Check size={20} /> Save Reward
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsScreen;
