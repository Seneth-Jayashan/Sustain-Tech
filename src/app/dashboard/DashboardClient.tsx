'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GameState } from '@/game/state';
import { SCENARIOS } from '@/game/scenario';
import WeatherOverlay from '@/components/WeatherOverlay';
import Typewriter from '@/components/Typewriter';
import { playUIBlip, playRadarPing, speakText, stopSpeaking } from '@/lib/audio';
import { Droplets, Coins, RadioTower, Users, AlertTriangle, Send, Info, LogOut } from 'lucide-react';
import Image from 'next/image';

interface Props {
  initialState: GameState;
  teamName: string;
  initialScenario: any;
}

export default function DashboardClient({ initialState, teamName, initialScenario }: Props) {
  const router = useRouter();
  const [state, setState] = useState<GameState>(initialState);
  const [currentScenario, setCurrentScenario] = useState<any>(initialScenario);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showBrief, setShowBrief] = useState(true);

  // Trigger audio on new scenario
  useEffect(() => {
    if (!currentScenario) return;
    playRadarPing();
    setShowBrief(true);
    
    if (voiceEnabled) {
      const fullBriefing = `Day ${state.day}. ${currentScenario.title}. ${currentScenario.situation}.`;
      speakText(fullBriefing);
    }
    
    return () => stopSpeaking();
  }, [state.bucket, currentScenario, state.day, voiceEnabled]);

  // Anti-AI Integrity Listeners
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      fetch('/api/game/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'RIGHT_CLICK_ATTEMPT' })
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        fetch('/api/game/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionType: 'VISIBILITY_CHANGE', metadata: { state: 'hidden' } })
        });
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatLKR = (amount: number) => `${(amount / 1000).toFixed(0)}k`;

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
          if (data.nextScenario) {
            setCurrentScenario(data.nextScenario);
          }
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (!currentScenario) return <div className="fixed inset-0 flex items-center justify-center bg-black"><span className="animate-pulse text-2xl font-mono text-blue-500">INITIALIZING LINK...</span></div>;

  const waterPercent = Math.round(((state.resources.drinkingWater + state.resources.agriculturalWater) / state.resources.storageCapacity) * 100);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white selection:bg-blue-500/30">
      
      {/* Background Map Layer */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/assets/map_normal.jpg" 
          alt="Community Map" 
          fill
          className="object-cover opacity-30 transition-opacity duration-1000 scale-105 animate-slow-pan"
          priority
          unoptimized
        />
        
        {/* Dynamic Holographic Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,10,30,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(0,10,30,0.1)_2px,transparent_2px)] bg-[size:40px_40px] opacity-30 pointer-events-none"></div>

        {/* Dynamic Weather directly applied over the map */}
        <WeatherOverlay floodScore={state.scores.floodPreparedness} droughtScore={state.scores.droughtPreparedness} />
        
        {/* Animated Radar Scanning Line */}
        <motion.div 
          animate={{ top: ['-10%', '110%'] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10 pointer-events-none"
        ></motion.div>

        {/* Vignette for cinematic feel */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_10%,_#000000_100%)] opacity-90 pointer-events-none z-10"></div>
      </div>

      {/* Graphical HUD (Top) */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="absolute top-0 inset-x-0 z-50 p-6 flex justify-between items-start pointer-events-none"
      >
        <div className="flex gap-4 pointer-events-auto">
          <div className="flex flex-col items-center bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-blue-900/50 shadow-2xl">
            <span className="text-3xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">DAY {state.day}</span>
            <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mt-1">Team {teamName}</span>
          </div>

          <button 
            onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); playUIBlip(); }}
            className={`flex items-center justify-center h-12 w-12 rounded-full border backdrop-blur-md transition-all ${voiceEnabled ? 'bg-blue-500/20 border-blue-400 text-blue-400' : 'bg-black/40 border-gray-700 text-gray-500 hover:border-gray-500'}`}
          >
            {voiceEnabled ? '🔊' : '🔈'}
          </button>
        </div>

        {/* Resource Gauges */}
        <div className="flex gap-4 pointer-events-auto">
          {/* Water */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-blue-900/30">
            <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400"><Droplets size={24} /></div>
            <div className="w-32">
              <div className="h-3 bg-gray-900 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${waterPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-bold font-mono text-gray-400 mt-1">
                <span>0</span><span>{waterPercent}%</span><span>100</span>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-green-900/30">
            <div className="bg-green-500/20 p-2 rounded-xl text-green-400"><Coins size={24} /></div>
            <div className="font-black font-mono text-2xl text-green-400 min-w-[80px] text-right">{formatLKR(state.resources.emergencyBudget)}</div>
          </div>

          {/* Intel & Trust (Small badges) */}
          <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border ${state.information.informationQuality < 40 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
              <RadioTower size={16} />
              <span className="font-bold text-sm">LVL {Math.round(state.information.informationQuality / 20)}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border ${state.community.communityTrust < 40 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'}`}>
              <Users size={16} />
              <span className="font-bold text-sm">LVL {Math.round(state.community.communityTrust / 20)}</span>
            </div>
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 backdrop-blur-md transition-all hover:bg-red-500/20 hover:border-red-400 ml-2"
            title="Disconnect"
          >
            <LogOut size={20} />
          </button>
        </div>
      </motion.header>

      {/* RPG Dialogue Box (Bottom Left) */}
      <AnimatePresence>
        {showBrief && (
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className="absolute bottom-[280px] left-8 z-40 max-w-2xl flex gap-6 items-end"
          >
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)] bg-black/80 flex-shrink-0 animate-pulse-glow">
              <Image src="/assets/portrait_advisor.jpg" alt="Advisor" fill className="object-cover" unoptimized />
              
              {/* Static noise overlay on portrait */}
              <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay opacity-50 animate-scanline pointer-events-none"></div>
            </div>
            
            <div className="relative bg-black/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl rounded-bl-none p-6 shadow-2xl mb-4">
              {/* Dialogue Pointer Tail */}
              <div className="absolute -left-3 bottom-0 w-4 h-4 bg-black/80 border-l border-b border-blue-500/30 transform skew-x-[30deg]"></div>
              
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-black text-blue-400 uppercase tracking-widest text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> INCOMING TRANSMISSION
                </h3>
                <button onClick={() => setShowBrief(false)} className="text-gray-500 hover:text-white"><AlertTriangle size={16}/></button>
              </div>
              
              <h2 className="text-xl font-bold mb-2 text-white">{currentScenario.title}</h2>
              <div className="text-gray-300 font-mono text-sm leading-relaxed min-h-[60px]">
                <Typewriter text={currentScenario.situation} speed={30} />
              </div>
              
              {currentScenario.conditions && currentScenario.conditions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-xs text-blue-500 font-bold mb-2 uppercase">Detected Events:</div>
                  <ul className="text-xs font-mono text-gray-400 space-y-1">
                    {currentScenario.conditions.map((ev: any, i: number) => (
                      <li key={i}>• {ev.field} {ev.operator} {ev.value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showBrief && (
        <button 
          onClick={() => setShowBrief(true)}
          className="absolute bottom-[280px] left-8 z-40 bg-blue-500/20 border border-blue-500 text-blue-400 p-4 rounded-full backdrop-blur-md hover:bg-blue-500/40 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        >
          <Info size={24} />
        </button>
      )}

      {/* Card Deck Action Matrix (Bottom) */}
      <motion.div 
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.8 }}
        className="absolute bottom-0 inset-x-0 h-[260px] bg-gradient-to-t from-black via-black/90 to-transparent z-50 flex flex-col justify-end pb-8 px-8"
      >
        <div className="flex items-end justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Directives <span className="text-white bg-white/20 px-2 py-0.5 rounded">{selectedOrder.length}/5</span></h3>
            {selectedOrder.length < 5 && <span className="text-xs text-blue-400 animate-pulse font-mono border border-blue-500/30 px-2 rounded-full">SELECT {5 - selectedOrder.length} MORE</span>}
          </div>
          
          <AnimatePresence>
            {selectedOrder.length === 5 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(74,222,128,0.4)" }}
                whileTap={{ scale: 0.95 }}
                disabled={submitting}
                onClick={handleSubmit}
                className="bg-green-500 text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-green-400 transition-colors shadow-[0_0_20px_rgba(74,222,128,0.3)]"
              >
                {submitting ? 'Executing...' : 'Engage'} <Send size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Horizontal Scrolling Card Track */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {currentScenario.actions.map((action: any) => {
            const rankIndex = selectedOrder.indexOf(action.id);
            const isSelected = rankIndex !== -1;
            
            return (
              <motion.button
                key={action.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -15, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSelection(action.id)}
                className={`relative flex-shrink-0 w-[280px] h-[150px] rounded-2xl border text-left p-5 transition-all duration-300 snap-center group overflow-hidden ${
                  isSelected 
                    ? 'border-green-400 bg-green-900/60 backdrop-blur-xl shadow-[0_0_35px_rgba(74,222,128,0.4)] transform -translate-y-4' 
                    : 'border-gray-700 bg-black/80 backdrop-blur-md hover:bg-blue-950/60 hover:border-blue-400/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                }`}
              >
                {/* Dynamic animated glow behind card */}
                {isSelected && <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 to-transparent rounded-2xl blur-xl -z-10 animate-pulse"></div>}
                
                {/* Tech lines on hover */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                    <AlertTriangle size={20} />
                  </div>
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-8 h-8 rounded-full bg-green-400 text-black flex items-center justify-center font-black shadow-[0_0_15px_rgba(74,222,128,0.8)]"
                    >
                      {rankIndex + 1}
                    </motion.div>
                  )}
                </div>

                <span className={`font-bold block leading-tight text-sm ${isSelected ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                  {action.title}
                </span>
                {action.description && (
                  <span className="text-[10px] font-mono text-gray-500 mt-2 block line-clamp-2 leading-relaxed">
                    {action.description}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
