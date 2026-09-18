'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GameState } from '@/game/types';
import { SCENARIOS } from '@/game/scenario';
import WeatherOverlay from '@/components/WeatherOverlay';
import Typewriter from '@/components/Typewriter';
import { playUIBlip, playRadarPing, speakText, stopSpeaking } from '@/lib/audio';

interface Props {
  initialState: GameState;
  teamName: string;
}

export default function DashboardClient({ initialState, teamName }: Props) {
  const router = useRouter();
  const [state, setState] = useState<GameState>(initialState);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const currentScenario = SCENARIOS[state.currentBucket];

  // Trigger audio on new scenario
  useEffect(() => {
    if (!currentScenario) return;
    playRadarPing();
    
    if (voiceEnabled) {
      const fullBriefing = `Day ${state.currentDay}. ${currentScenario.title}. ${currentScenario.situation}. Intelligence reports: ${currentScenario.events.join('. ')}`;
      speakText(fullBriefing);
    }
    
    return () => stopSpeaking();
  }, [state.currentBucket, currentScenario, state.currentDay, voiceEnabled]);

  const formatLKR = (amount: number) => `LKR ${amount.toLocaleString()}`;

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
    playUIBlip();
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
    stopSpeaking();
    
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

  if (!currentScenario) return <div className="text-center p-20 font-mono animate-pulse text-xl">INITIALIZING COMMAND TERMINAL...</div>;

  const waterPercent = Math.round((state.waterStorage / state.waterCapacity) * 100);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 relative pb-10">
      <WeatherOverlay floodScore={state.variables.F} droughtScore={state.variables.D} />
      
      {/* Top Status Bar - HUD Style */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel border-b border-[var(--color-sustain-accent)] rounded-b-3xl p-6 flex flex-wrap md:flex-nowrap items-center justify-between gap-6 sticky top-0 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-widest text-[var(--color-sustain-accent)] animate-pulse flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            LIVE LINK: TEAM {teamName}
          </span>
          <span className="text-3xl font-black font-mono tracking-tighter">DAY {state.currentDay.toString().padStart(2, '0')}</span>
          <button 
            onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); playUIBlip(); }}
            className="text-xs text-gray-500 hover:text-white transition-colors text-left mt-2 border border-gray-800 rounded px-2 py-1 max-w-fit"
          >
            {voiceEnabled ? '🔊 VOICE: ON' : '🔈 VOICE: OFF'}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 md:gap-10 flex-1 justify-end text-sm font-mono uppercase">
          <div className="flex flex-col items-end gap-1">
            <span className="text-gray-500 tracking-wider">RESERVOIR</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-1.5 bg-gray-900 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${waterPercent}%` }} />
              </div>
              <span className="font-bold text-blue-400">{waterPercent}%</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-gray-500 tracking-wider">FUNDS</span>
            <span className="text-green-400 font-bold text-lg shadow-green-500/20">{formatLKR(state.budget)}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-gray-500 tracking-wider">INTEL</span>
            <span className={\`font-bold \${state.variables.I < 40 ? 'text-orange-400' : 'text-blue-400'}\`}>{getConfidenceText(state.variables.I)}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-gray-500 tracking-wider">TRUST</span>
            <span className={\`font-bold \${state.variables.C < 40 ? 'text-red-400' : 'text-purple-400'}\`}>{getTrustText(state.variables.C)}</span>
          </div>
        </div>
      </motion.header>

      {/* Main Situation Panel */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={state.currentBucket}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="grid lg:grid-cols-12 gap-8 px-4 mt-4"
        >
          {/* Left Column: Intelligence Console */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-2xl border border-gray-800 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-sustain-accent)]/5 to-transparent opacity-50"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-black mb-6 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  {currentScenario.title}
                </h2>
                <div className="text-gray-300 leading-relaxed font-mono text-sm min-h-[100px]">
                  <Typewriter text={currentScenario.situation} speed={25} />
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-blue-900/50 bg-blue-950/10">
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"></span>
                </span>
                Active Surveillance
              </h3>
              <ul className="space-y-4">
                {currentScenario.events.map((ev, i) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + (i * 0.5) }}
                    key={i} 
                    className="text-sm font-mono text-blue-100/80 border-l-2 border-blue-500/30 pl-4 py-1"
                  >
                    <Typewriter text={ev} speed={40} />
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Holographic Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-2xl border border-gray-800">
              <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest text-[var(--color-sustain-accent)]">Action Matrix</h3>
                  <p className="text-xs font-mono text-gray-500 mt-2 tracking-wider">AWAITING DIRECTIVES // SELECT TOP 5 PROTOCOLS</p>
                </div>
                <div className="font-mono text-2xl font-black text-gray-700">
                  <span className={selectedOrder.length === 5 ? "text-green-400 shadow-green-400/50 drop-shadow-md" : ""}>
                    {selectedOrder.length}
                  </span>
                  /5
                </div>
              </div>
              
              <div className="grid gap-4">
                {currentScenario.actions.map((action) => {
                  const rankIndex = selectedOrder.indexOf(action.id);
                  const isSelected = rankIndex !== -1;
                  
                  return (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: 1.02, x: 10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSelection(action.id)}
                      className={\`relative flex items-center justify-between p-5 rounded-xl border transition-all duration-300 text-left overflow-hidden group \${
                        isSelected 
                          ? 'border-[var(--color-sustain-accent)] bg-[var(--color-sustain-accent)]/10 shadow-[0_0_25px_rgba(45,212,191,0.15)]' 
                          : 'border-gray-800 bg-black/40 hover:border-gray-600 hover:bg-gray-900/50'
                      }\`}
                    >
                      {/* Scanline effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] -top-[100%] group-hover:animate-scanline pointer-events-none opacity-0 group-hover:opacity-100"></div>

                      <div className="relative z-10 pr-12">
                        <span className={\`font-bold block text-lg mb-1 \${isSelected ? 'text-white' : 'text-gray-300'}\`}>{action.title}</span>
                        {action.description && <span className="text-xs font-mono text-gray-500 block leading-relaxed">{action.description}</span>}
                      </div>
                      
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="absolute right-5 flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-sustain-accent)] text-black flex items-center justify-center font-black font-mono text-xl shadow-[0_0_20px_rgba(45,212,191,0.6)]"
                        >
                          {rankIndex + 1}
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-end">
                <motion.button
                  whileHover={selectedOrder.length === 5 ? { scale: 1.05, boxShadow: "0px 0px 30px rgba(45,212,191,0.5)" } : {}}
                  whileTap={selectedOrder.length === 5 ? { scale: 0.95 } : {}}
                  disabled={selectedOrder.length !== 5 || submitting}
                  onClick={handleSubmit}
                  className={\`px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all duration-500 flex items-center gap-3 \${
                    selectedOrder.length === 5 
                      ? 'bg-[var(--color-sustain-accent)] text-black cursor-pointer' 
                      : 'bg-gray-900 border border-gray-800 text-gray-600 cursor-not-allowed'
                  }\`}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      EXECUTING...
                    </span>
                  ) : 'INITIATE DIRECTIVES'}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
