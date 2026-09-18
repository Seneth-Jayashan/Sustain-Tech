'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GameState } from '@/game/types';
import { SCENARIOS } from '@/game/scenario';

interface Props {
  initialState: GameState;
  teamName: string;
}

export default function DashboardClient({ initialState, teamName }: Props) {
  const router = useRouter();
  const [state, setState] = useState<GameState>(initialState);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const currentScenario = SCENARIOS[state.currentBucket];

  // Helper to format currency
  const formatLKR = (amount: number) => `LKR ${amount.toLocaleString()}`;

  // Helper to get text confidence
  const getConfidenceText = (I: number) => {
    if (I > 80) return 'HIGH CONFIDENCE';
    if (I > 40) return 'MODERATE CONFIDENCE';
    return 'LOW CONFIDENCE';
  };

  const getTrustText = (C: number) => {
    if (C > 80) return 'EXCELLENT';
    if (C > 60) return 'GOOD';
    if (C > 40) return 'MODERATE';
    return 'POOR';
  };

  const toggleSelection = (actionId: string) => {
    if (selectedOrder.includes(actionId)) {
      setSelectedOrder(prev => prev.filter(id => id !== actionId));
    } else {
      if (selectedOrder.length < 5) {
        setSelectedOrder(prev => [...prev, actionId]);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedOrder.length !== 5) return;
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/game/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankings: selectedOrder })
      });
      
      const data = await res.json();
      if (data.success) {
        if (data.gameSession.status === 'COMPLETED') {
          router.push('/reflection');
        } else {
          setState(data.gameSession.state);
          setSelectedOrder([]);
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to submit decision.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentScenario) return <div>Loading scenario...</div>;

  const waterPercent = Math.round((state.waterStorage / state.waterCapacity) * 100);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top Status Bar */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel rounded-xl p-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 sticky top-4 z-50"
      >
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-[var(--color-sustain-accent)]">Team {teamName}</span>
          <span className="text-2xl font-bold font-mono">DAY {state.currentDay.toString().padStart(2, '0')} / 10</span>
        </div>
        
        <div className="flex flex-wrap gap-4 md:gap-8 flex-1 justify-end text-sm font-mono uppercase">
          <div className="flex flex-col items-end">
            <span className="text-gray-400">💧 Water</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 transition-all duration-1000" style={{ width: `${waterPercent}%` }} />
              </div>
              <span>{waterPercent}%</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-400">💰 Budget</span>
            <span className="text-green-400">{formatLKR(state.budget)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-400">📡 Data</span>
            <span className={state.variables.I < 40 ? 'text-orange-400' : 'text-blue-400'}>{getConfidenceText(state.variables.I)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-400">🤝 Community</span>
            <span className={state.variables.C < 40 ? 'text-red-400' : 'text-purple-400'}>{getTrustText(state.variables.C)}</span>
          </div>
        </div>
      </motion.header>

      {/* Main Situation Panel */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={state.currentBucket}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {/* Left Column: Situation & Events */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="glass-panel p-6 rounded-xl border-l-4 border-l-[var(--color-sustain-accent)]">
              <h2 className="text-xl font-bold mb-4 uppercase tracking-wider">{currentScenario.title}</h2>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">{currentScenario.situation}</p>
            </div>

            <div className="glass-panel p-6 rounded-xl border-l-4 border-l-blue-500">
              <h3 className="text-sm uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                Intelligence Brief
              </h3>
              <ul className="space-y-3">
                {currentScenario.events.map((ev, i) => (
                  <motion.li 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    key={i} 
                    className="text-sm text-gray-300 border-b border-gray-800 pb-2 last:border-0"
                  >
                    {ev}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Actions to Rank */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="glass-panel p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-2">Decision Required</h3>
              <p className="text-sm text-gray-400 mb-6">Select the following actions in order of priority (1st to 5th). Click again to deselect.</p>
              
              <div className="flex flex-col gap-3">
                {currentScenario.actions.map((action) => {
                  const rankIndex = selectedOrder.indexOf(action.id);
                  const isSelected = rankIndex !== -1;
                  
                  return (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(45, 212, 191, 0.1)' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleSelection(action.id)}
                      className={`relative flex items-center justify-between p-4 rounded-lg border text-left transition-all ${
                        isSelected 
                          ? 'border-[var(--color-sustain-accent)] bg-[var(--color-sustain-accent)]/10' 
                          : 'border-gray-700 bg-black/40 hover:border-gray-500'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block">{action.title}</span>
                        {action.description && <span className="text-xs text-gray-400 mt-1 block">{action.description}</span>}
                      </div>
                      
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-sustain-accent)] text-black flex items-center justify-center font-bold font-mono ml-4 shadow-[0_0_15px_rgba(45,212,191,0.5)]"
                        >
                          {rankIndex + 1}
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <motion.button
                  whileHover={selectedOrder.length === 5 ? { scale: 1.05 } : {}}
                  whileTap={selectedOrder.length === 5 ? { scale: 0.95 } : {}}
                  disabled={selectedOrder.length !== 5 || submitting}
                  onClick={handleSubmit}
                  className={`px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all ${
                    selectedOrder.length === 5 
                      ? 'bg-[var(--color-sustain-accent)] text-black shadow-[0_0_20px_rgba(45,212,191,0.4)] cursor-pointer hover:bg-teal-400' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Processing...' : 'Lock Decision'}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
