'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GameState } from '@/game/state';
import { SCENARIOS } from '@/game/scenario';
import WeatherOverlay from '@/components/WeatherOverlay';
import Typewriter from '@/components/Typewriter';
import { playUIBlip, playRadarPing, speakText, stopSpeaking } from '@/lib/audio';
import { Droplets, Coins, RadioTower, Users, AlertTriangle, Send, Info, LogOut, Activity, WifiOff, ShieldAlert, Navigation, Terminal, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

// Advanced Visualizers

const GlitchText = ({ text, className }: { text: string, className?: string }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-[2px] -ml-[2px] text-red-500 opacity-70 z-0 animate-pulse mix-blend-screen clip-text-glitch1">{text}</span>
      <span className="absolute top-0 -left-[2px] -ml-[2px] text-blue-500 opacity-70 z-0 animate-pulse mix-blend-screen clip-text-glitch2">{text}</span>
    </div>
  );
};

const WaterTank = ({ percent }: { percent: number }) => (
  <div className="relative w-56 h-80 border border-slate-700/50 rounded-[40px] overflow-hidden shadow-2xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-end p-2">
    {/* Grid Background */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
    
    <div className="absolute top-6 w-full text-center z-20 font-mono">
      <span className="text-[11px] tracking-[0.3em] text-slate-400 font-bold uppercase">Reservoir Cap</span>
      <div className={`text-6xl font-black mt-1 tracking-tighter drop-shadow-lg ${percent > 90 ? 'text-red-400' : percent < 30 ? 'text-amber-400' : 'text-cyan-400'}`}>
        {percent}%
      </div>
      {percent > 90 && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-[10px] text-red-100 font-black tracking-widest mt-2 bg-red-600/80 mx-10 py-1 rounded uppercase shadow-[0_0_15px_rgba(239,68,68,0.8)]">Critical Spill</motion.div>}
      {percent < 30 && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-[10px] text-amber-100 font-black tracking-widest mt-2 bg-amber-600/80 mx-10 py-1 rounded uppercase shadow-[0_0_15px_rgba(245,158,11,0.8)]">Low Level</motion.div>}
    </div>

    {/* The Water Liquid */}
    <div className="w-full relative rounded-[32px] overflow-hidden border border-white/10 bg-slate-900/50" style={{ height: '70%' }}>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: `${Math.min(100, percent)}%` }}
        transition={{ type: 'spring', bounce: 0.2, duration: 2 }}
        className={`absolute bottom-0 w-full rounded-b-[32px] overflow-hidden ${
          percent > 90 ? 'bg-gradient-to-t from-red-600 to-red-400 shadow-[0_-10px_30px_rgba(239,68,68,0.5)]' 
          : percent < 30 ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_-10px_30px_rgba(245,158,11,0.5)]'
          : 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_-10px_30px_rgba(6,182,212,0.5)]'
        }`}
      >
        <div className="absolute top-0 w-[200%] h-4 -ml-[50%] animate-wave bg-white/20 mix-blend-overlay"></div>
        <div className="absolute top-1 w-[200%] h-4 -ml-[25%] animate-wave bg-white/10 mix-blend-overlay" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
      </motion.div>
    </div>
  </div>
);

const CommsGrid = ({ health }: { health: number }) => {
  const isFailing = health < 40;
  return (
    <div className="relative w-56 h-80 border border-slate-700/50 rounded-[40px] overflow-hidden shadow-2xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-between p-6">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      <div className="text-center z-20 font-mono w-full">
        <span className="text-[11px] tracking-[0.3em] text-slate-400 font-bold uppercase">Network Integrity</span>
        <div className={`text-6xl font-black mt-1 tracking-tighter drop-shadow-lg ${isFailing ? 'text-red-400' : 'text-emerald-400'}`}>
          {Math.round(health)}%
        </div>
      </div>
      
      <div className="relative w-32 h-32 flex items-center justify-center mt-4">
        {/* Radar Sweep */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className={`absolute inset-0 rounded-full ${isFailing ? 'border-red-500/20' : 'border-emerald-500/20'} border`}
          style={{ background: isFailing ? 'conic-gradient(from 0deg, transparent 0deg, rgba(239,68,68,0.4) 360deg)' : 'conic-gradient(from 0deg, transparent 0deg, rgba(16,185,129,0.4) 360deg)' }}
        ></motion.div>
        
        {/* Rings */}
        {[1, 2, 3].map((ring) => (
          <div key={ring} className={`absolute rounded-full border ${isFailing ? 'border-red-500/30' : 'border-emerald-500/30'}`} style={{ width: `${ring * 33}%`, height: `${ring * 33}%` }}></div>
        ))}
        
        {/* Center Icon */}
        <div className={`z-20 p-3 rounded-full backdrop-blur-md ${isFailing ? 'bg-red-900/80 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-emerald-900/80 shadow-[0_0_20px_rgba(16,185,129,0.6)]'}`}>
          {isFailing ? <WifiOff size={24} className="text-red-300 animate-pulse" /> : <RadioTower size={24} className="text-emerald-300" />}
        </div>
      </div>

      <div className={`w-full py-2 mt-4 rounded-lg text-center font-bold text-xs uppercase tracking-widest ${isFailing ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {isFailing ? 'Signal Lost' : 'Optimal'}
      </div>
    </div>
  );
};

// 3D Tilt Card Component
const ActionCard = ({ action, isSelected, rankIndex, onClick }: any) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  function handleMouse(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      x.set(event.clientX - rect.left - rect.width / 2);
      y.set(event.clientY - rect.top - rect.height / 2);
    }
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onClick={onClick}
      className={`relative flex-shrink-0 w-[300px] md:w-[325px] min-h-[190px] rounded-2xl border text-left p-5 transition-colors duration-300 snap-center group overflow-hidden ${
        isSelected
          ? 'border-emerald-400 bg-emerald-950/60 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.3)]'
          : 'border-slate-700 bg-slate-900/60 backdrop-blur-md hover:bg-slate-800/80 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]'
      }`}
    >
      {/* Dynamic Animated Glow */}
      {isSelected && (
        <motion.div 
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-emerald-400/10 rounded-2xl blur-xl -z-10 bg-[length:200%_200%]" 
        />
      )}

      {/* Cyberpunk Tech Lines */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transform: 'translateZ(20px)' }}></div>
      <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ transform: 'translateZ(20px)' }}></div>

      <div className="flex justify-between items-start mb-3" style={{ transform: 'translateZ(30px)' }}>
        <div className={`p-2.5 rounded-xl backdrop-blur-md border ${isSelected ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50'}`}>
          <Terminal size={18} />
        </div>
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              className="w-8 h-8 rounded-full bg-emerald-400 text-black flex items-center justify-center font-black shadow-[0_0_20px_rgba(16,185,129,0.8)] text-lg"
            >
              {rankIndex + 1}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className={`font-bold block leading-tight text-[13px] tracking-wide ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} style={{ transform: 'translateZ(40px)' }}>
        {action.title}
      </span>
      {action.description && (
        <span className="text-[10px] font-mono text-slate-400 mt-1.5 block line-clamp-2 leading-relaxed" style={{ transform: 'translateZ(20px)' }}>
          {action.description}
        </span>
      )}

      {/* Real Financial Cost & Priority Efficacy */}
      <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono border-t border-slate-800/80 pt-2.5" style={{ transform: 'translateZ(30px)' }}>
        <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
          Cost: LKR {Math.abs(action.baseImpacts?.emergencyBudget ?? action.impacts?.emergencyBudget ?? 0)}M
        </span>
        {isSelected ? (
          <span className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30 text-[10px]">
            {rankIndex === 0 ? 'Immediate (100%)' :
             rankIndex === 1 ? 'Fast (85%)' :
             rankIndex === 2 ? 'Standard (70%)' :
             rankIndex === 3 ? 'Delayed (50%)' : 'Backlog (30%)'}
          </span>
        ) : (
          <span className="text-slate-500 text-[10px]">Unassigned</span>
        )}
      </div>
    </motion.button>
  );
};


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

  const formatLKR = (amount: number) => `${(amount).toFixed(0)}M`;

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
          setSubmitting(false);
        }
      } else {
        alert(data.error || 'Failed to submit decision.');
        setSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to submit decision.');
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (!currentScenario) return <div className="fixed inset-0 flex items-center justify-center bg-[#020617]"><span className="animate-pulse text-3xl font-mono font-black text-cyan-500 tracking-[0.5em]">ESTABLISHING_UPLINK...</span></div>;

  const waterPercent = Math.max(5, Math.min(100, Math.round(state.scores?.droughtPreparedness ?? state.resources?.drinkingWater ?? 50)));

  // Projected financial impact of current selection
  const currentBudget = state.resources?.emergencyBudget ?? 500;
  
  const projectedDrain = (() => {
    if (state.bucket === 3) {
      return selectedOrder.length > 0 && selectedOrder[0] !== '3E' ? 100 : 0;
    }
    if (state.bucket === 4) {
      return selectedOrder.length > 0 && selectedOrder[0] === '4E' ? 0 : 60;
    }
    const top3 = selectedOrder.slice(0, 3);
    let netDrain = 0;
    top3.forEach(id => {
      const act = currentScenario?.actions?.find((a: any) => a.id === id);
      if (act) {
        netDrain -= (act.impacts?.emergencyBudget ?? 0);
      }
    });
    return netDrain;
  })();

  const projectedNewBudget = currentBudget - (selectedOrder.length > 0 ? projectedDrain : 0);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden text-slate-200 selection:bg-cyan-500/30 font-sans bg-black flex flex-col justify-between">
      
      {/* Animated Dynamic Background Layer */}
      <motion.div 
        animate={{ 
          background: [
            'radial-gradient(circle at 20% 30%, #0f172a 0%, #020617 100%)',
            'radial-gradient(circle at 80% 70%, #064e3b 0%, #020617 100%)',
            'radial-gradient(circle at 50% 50%, #4c1d95 0%, #020617 100%)',
            'radial-gradient(circle at 20% 30%, #0f172a 0%, #020617 100%)',
          ]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="fixed inset-0 z-0 pointer-events-none"
      >
        {/* Holographic Hex Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTIwIDAgTDIwIDIwIE0yMCAyMCBMNDAgMTAgTTIwIDIwIEwwIDEwIiBzdHJva2U9InJnYmEoNiwgMTgyLCAyMTIsIDAuMDgpIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-20"></div>
        
        {/* Floating Ambient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen opacity-60">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-3xl"
              style={{
                width: Math.random() * 300 + 200,
                height: Math.random() * 300 + 200,
                background: i % 2 === 0 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              }}
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              }}
              animate={{
                x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)],
                y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: Math.random() * 20 + 30,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>

        {/* Central Dashboard Visualizers */}
        <div className="fixed inset-0 flex items-center justify-center gap-32 pointer-events-none pb-32">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ type: 'spring', bounce: 0.4, duration: 1.5 }}
            className="hover:scale-105 transition-transform duration-500"
          >
            <WaterTank percent={waterPercent} />
          </motion.div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ type: 'spring', bounce: 0.4, duration: 1.5, delay: 0.2 }}
            className="hover:scale-105 transition-transform duration-500"
          >
            <CommsGrid health={state.information?.informationQuality ?? state.operations?.communication ?? 50} />
          </motion.div>
        </div>

        <WeatherOverlay floodScore={state.scores.floodPreparedness} droughtScore={state.scores.droughtPreparedness} />

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(2,6,23,0.95)_100%)] pointer-events-none z-10"></div>
      </motion.div>

      {/* Top HUD */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.3, damping: 20 }}
        className="sticky top-0 inset-x-0 z-50 p-4 md:p-6 flex justify-between items-start pointer-events-none"
      >
        <div className="flex gap-4 pointer-events-auto items-center">
          <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <GlitchText text={`DAY ${state.day}`} className="text-4xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold mt-1">Sustain-Tech</span>
          </div>

          <button
            onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); playUIBlip(); }}
            className={`flex items-center justify-center h-12 w-12 rounded-2xl border backdrop-blur-xl transition-all shadow-lg ${voiceEnabled ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-900/60 border-slate-700 text-slate-500 hover:border-slate-500'}`}
          >
            {voiceEnabled ? '🔊' : '🔈'}
          </button>
        </div>

        {/* Stats Matrix */}
        <div className="flex gap-4 pointer-events-auto">
          {/* Budget Display - Highly styled with deficit awareness */}
          <div className={`flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl p-3 border ${
            state.resources.emergencyBudget < 0
              ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.25)]'
              : state.resources.emergencyBudget === 0
              ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
              : 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
          } relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-16 h-16 ${state.resources.emergencyBudget <= 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'} blur-2xl rounded-full`}></div>
            <div className={`${state.resources.emergencyBudget <= 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'} p-2.5 rounded-xl border`}>
              <Coins size={22} />
            </div>
            <div className="flex flex-col items-end pr-2">
              <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
                state.resources.emergencyBudget < 0 ? 'text-red-400' : state.resources.emergencyBudget === 0 ? 'text-amber-400' : 'text-emerald-500/80'
              }`}>
                {state.resources.emergencyBudget < 0 ? 'Credit Facility Drawn' : 'Provincial Budget'}
              </span>
              <div className={`font-black font-mono text-2xl tracking-tight ${
                state.resources.emergencyBudget < 0 
                  ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
                  : state.resources.emergencyBudget === 0
                  ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              }`}>
                {state.resources.emergencyBudget < 0 ? `-LKR ${Math.abs(state.resources.emergencyBudget).toFixed(0)}M` : `LKR ${formatLKR(state.resources.emergencyBudget)}`}
              </div>
              {state.resources.emergencyBudget < 0 && (
                <span className="text-[9px] font-mono font-semibold text-amber-300/90 tracking-wide mt-0.5">
                  LKR {Math.max(0, 200 - Math.abs(state.resources.emergencyBudget)).toFixed(0)}M Facility Avail
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'FLOOD', val: state.scores.floodPreparedness, icon: Navigation, border: 'border-blue-500/30', text: 'text-blue-400', bar: 'bg-blue-500' },
              { label: 'DROUGHT', val: state.scores.droughtPreparedness, icon: Droplets, border: 'border-amber-500/30', text: 'text-amber-400', bar: 'bg-amber-500' },
              { label: 'INTEL', val: state.information.informationQuality, icon: RadioTower, border: 'border-cyan-500/30', text: 'text-cyan-400', bar: 'bg-cyan-500' },
              { label: 'TRUST', val: state.community.communityTrust, icon: Users, border: 'border-purple-500/30', text: 'text-purple-400', bar: 'bg-purple-500' }
            ].map((metric, idx) => (
              <motion.div 
                key={metric.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`flex items-center justify-between w-48 px-3 py-1 rounded-xl backdrop-blur-xl border bg-slate-900/80 shadow-lg ${metric.border} ${metric.text}`}
              >
                <div className="flex items-center gap-2">
                  <metric.icon size={13} className="opacity-80" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(100, Math.max(0, metric.val))}%` }} 
                      className={`h-full ${metric.bar} shadow-[0_0_10px_currentColor]`} 
                    />
                  </div>
                  <span className="font-bold text-xs font-mono">{Math.round(metric.val)}%</span>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-900/80 border border-red-500/30 text-red-400 backdrop-blur-xl transition-all hover:bg-red-950/80 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] ml-2"
          >
            <LogOut size={18} />
          </button>
        </div>
      </motion.header>

      {/* Narrative HUD - Come & Going Advisor */}
      <AnimatePresence>
        {showBrief && (
          <motion.div
            initial={{ x: -400, opacity: 0, rotateY: 30 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            exit={{ x: -400, opacity: 0, rotateY: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="absolute top-[140px] left-8 z-40 max-w-xl perspective-[1000px]"
          >
            <div className="relative flex flex-col gap-4">
              {/* Advisor Avatar Pop-in */}
              <motion.div 
                initial={{ y: 50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.3, type: "spring" }}
                className="flex items-end gap-4"
              >
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)] bg-black z-20">
                  <Image src="/assets/portrait_advisor.jpg" alt="Advisor" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay"></div>
                </div>
                <div className="bg-cyan-950/80 border border-cyan-500/50 px-4 py-2 rounded-t-xl rounded-br-xl backdrop-blur-md mb-2 shadow-lg">
                  <span className="text-cyan-400 font-black tracking-widest text-xs uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Priority Message
                  </span>
                </div>
              </motion.div>

              {/* Message Box */}
              <motion.div 
                className="relative bg-slate-900/90 backdrop-blur-2xl border border-slate-700 rounded-3xl p-6 shadow-2xl overflow-hidden ml-8 z-10"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-3xl rounded-full"></div>
                
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-black text-white tracking-tight">{currentScenario.title}</h2>
                  <button onClick={() => setShowBrief(false)} className="text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full hover:bg-red-500/20 hover:text-red-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>

                <div className="text-slate-300 font-sans text-sm leading-relaxed min-h-[60px]">
                  <Typewriter text={currentScenario.situation} speed={25} />
                </div>

                {currentScenario.events && currentScenario.events.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 pt-3 border-t border-slate-800">
                    <div className="flex flex-col gap-1.5">
                      {currentScenario.events.map((ev: string, i: number) => (
                        <div key={i} className="text-[11px] font-mono text-cyan-200/90 flex items-start gap-2">
                          <span className="text-cyan-400 mt-0.5">•</span>
                          <span>{ev}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showBrief && (
        <motion.button
          initial={{ scale: 0, x: -50 }}
          animate={{ scale: 1, x: 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowBrief(true)}
          className="absolute top-[160px] left-8 z-40 bg-slate-900/80 border border-slate-700 text-cyan-400 p-3 rounded-full backdrop-blur-xl hover:bg-slate-800 transition-all shadow-lg flex items-center gap-3 pr-4 group"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-500/50">
            <Image src="/assets/portrait_advisor.jpg" alt="Advisor" fill className="object-cover grayscale group-hover:grayscale-0 transition-all" unoptimized />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">Call Advisor</span>
        </motion.button>
      )}

      {/* Submission Overlay HUD */}
      <AnimatePresence>
        {submitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center font-mono"
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-500 opacity-50"></motion.div>
              <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-4 rounded-full border-b-2 border-l-2 border-emerald-500 opacity-50"></motion.div>
              <span className="text-2xl font-black text-white tracking-[0.2em] animate-pulse">EXECUTING</span>
            </div>
            <p className="mt-8 text-cyan-400 tracking-[0.3em] text-sm">TRANSMITTING DIRECTIVES TO FIELD UNITS...</p>
            <motion.div className="w-96 h-1 bg-slate-800 mt-4 rounded-full overflow-hidden">
              <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, ease: "easeInOut" }} className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,1)]"></motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Action Deck (Bottom) */}
      <motion.div
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 1 }}
        className="relative md:sticky bottom-0 inset-x-0 min-h-[350px] bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent z-40 flex flex-col justify-end pb-8 pt-4 px-4 md:px-10 mt-auto"
      >
        {/* Active Dynamic Events Alert Banner */}
        {state.activeDynamicEvents && state.activeDynamicEvents.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {state.activeDynamicEvents.map((evt: any, i: number) => (
              <div 
                key={i} 
                className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] flex items-center gap-2 backdrop-blur-xl shadow-lg ${
                  evt.impactType === 'positive' 
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' 
                    : evt.impactType === 'warning'
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                    : 'bg-red-950/70 border-red-500/50 text-red-300'
                }`}
              >
                <span className="font-bold uppercase tracking-wider">{evt.title}:</span>
                <span className="text-slate-300">{evt.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pre-Authorization Directives Summary Tray */}
        {selectedOrder.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-black flex items-center gap-2">
                  <Terminal size={14} /> Priority Directives Sequence:
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {state.bucket === 3 
                    ? 'Rank 1 Package Executes (Cost: LKR 100M)' 
                    : state.bucket === 4 
                    ? 'Rank 1 Fleet Plan Executes (Fee: LKR 60M)' 
                    : 'Ranks 1–3 Execute in Order | Ranks 4–5 Placed on Standby'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Est. Round Drain:</span>
                  <span className={`font-black ${projectedDrain > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {projectedDrain > 0 ? `-LKR ${projectedDrain}M` : `+LKR ${Math.abs(projectedDrain)}M`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Projected Balance:</span>
                  <span className={`font-black ${projectedNewBudget < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {projectedNewBudget < 0 ? `-LKR ${Math.abs(projectedNewBudget)}M` : `LKR ${projectedNewBudget}M`}
                  </span>
                  {projectedNewBudget < 0 && (
                    <span className="text-[10px] text-red-300 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/40">
                      {Math.max(0, 200 - Math.abs(projectedNewBudget))}M Facility Left
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOrder([])}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-red-400 bg-slate-800/80 hover:bg-red-950/40 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors ml-auto md:ml-0"
                >
                  <RotateCcw size={12} /> Clear Order
                </button>
              </div>
            </div>

            {/* 5 Ordered Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-3">
              {[0, 1, 2, 3, 4].map((slotIdx) => {
                const actionId = selectedOrder[slotIdx];
                const action = actionId ? currentScenario?.actions?.find((a: any) => a.id === actionId) : null;
                const isExecuting = state.bucket === 3 || state.bucket === 4 ? slotIdx === 0 : slotIdx < 3;
                
                return (
                  <div
                    key={slotIdx}
                    className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      action 
                        ? isExecuting
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-slate-950/50 border-slate-700/60 opacity-60'
                        : 'bg-black/30 border-dashed border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                        isExecuting ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Rank {slotIdx + 1}
                      </span>
                      <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${
                        isExecuting ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {isExecuting ? 'Executes' : 'Standby'}
                      </span>
                    </div>

                    {action ? (
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                          <span className="text-cyan-400 font-mono">[{action.id}]</span>
                          <span className="truncate">{action.title}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>
                            {(action.impacts?.emergencyBudget ?? 0) < 0 
                              ? `Cost: LKR ${Math.abs(action.impacts.emergencyBudget)}M`
                              : (action.impacts?.emergencyBudget ?? 0) > 0
                              ? `Grant: +LKR ${action.impacts.emergencyBudget}M`
                              : 'Cost: LKR 0M'}
                          </span>
                          <button
                            onClick={() => toggleSelection(action.id)}
                            className="text-slate-500 hover:text-red-400 p-0.5"
                            title="Remove from ranking"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500 italic py-2">
                        Awaiting card click...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="flex items-end justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
              {state.bucket === 3 
                ? 'Fiscal Allocation (LKR 100M Cap)' 
                : state.bucket === 4 
                ? 'Emergency Fleet Distribution' 
                : 'Operational Priority Directives'}
              <span className="text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 shadow-inner">{selectedOrder.length}/5</span>
            </h3>
            {selectedOrder.length < 5 && (
              <span className="text-xs text-cyan-400 animate-pulse font-mono border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 rounded-full tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                AWAITING {5 - selectedOrder.length} INPUTS
              </span>
            )}
          </div>

          <AnimatePresence>
            {selectedOrder.length === 5 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 40px rgba(16,185,129,0.5)" }}
                whileTap={{ scale: 0.95 }}
                disabled={submitting}
                onClick={handleSubmit}
                className="bg-emerald-500 text-[#020617] px-8 py-3.5 rounded-xl font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)] overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <div className="flex flex-col text-left">
                  <span className="text-xs tracking-[0.2em]">{submitting ? 'EXECUTING DIRECTIVES...' : 'AUTHORIZE DIRECTIVES'}</span>
                  <span className="text-[10px] font-mono lowercase tracking-normal text-emerald-950 font-bold">
                    {state.bucket === 3 || state.bucket === 4 ? `executes plan ${selectedOrder[0]}` : `executes top 3: ${selectedOrder.slice(0, 3).join(', ')}`}
                  </span>
                </div>
                <Send size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Cinematic Card Track */}
        <div className="flex gap-6 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory relative" style={{ scrollbarWidth: 'thin' }}>
          {currentScenario.actions.map((action: any, index: number) => {
            const rankIndex = selectedOrder.indexOf(action.id);
            const isSelected = rankIndex !== -1;
            
            return (
              <ActionCard 
                key={action.id} 
                action={action} 
                isSelected={isSelected} 
                rankIndex={rankIndex} 
                onClick={() => toggleSelection(action.id)} 
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
