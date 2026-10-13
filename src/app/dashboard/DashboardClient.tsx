'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GameState } from '@/game/state';
import { SCENARIOS } from '@/game/scenario';
import { findAction } from '@/game/engine';
import { ACTION_MATRIX } from '@/game/matrix';
import WeatherOverlay from '@/components/WeatherOverlay';
import Typewriter from '@/components/Typewriter';
import { playUIBlip, playRadarPing, speakText, stopSpeaking } from '@/lib/audio';
import { 
  Droplets, Coins, RadioTower, Users, AlertTriangle, Send, Info, LogOut, 
  Activity, WifiOff, ShieldAlert, Navigation, Terminal, RotateCcw, 
  CheckCircle2, ArrowRight, Truck, Ship, Sliders, Layers, Plus, Minus,
  ChevronDown, ChevronUp, Eye
} from 'lucide-react';
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
  <div className="relative w-40 sm:w-52 md:w-56 h-60 sm:h-72 md:h-80 border border-slate-700/50 rounded-[28px] sm:rounded-[40px] overflow-hidden shadow-2xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-end p-2">
    {/* Grid Background */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
    
    <div className="absolute top-4 sm:top-6 w-full text-center z-20 font-mono">
      <span className="text-[9px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.3em] text-slate-400 font-bold uppercase">Reservoir Cap</span>
      <div className={`text-4xl sm:text-5xl md:text-6xl font-black mt-0.5 sm:mt-1 tracking-tighter drop-shadow-lg ${percent > 90 ? 'text-red-400' : percent < 30 ? 'text-amber-400' : 'text-cyan-400'}`}>
        {percent}%
      </div>
      {percent > 90 && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-[9px] sm:text-[10px] text-red-100 font-black tracking-widest mt-1.5 sm:mt-2 bg-red-600/80 mx-4 sm:mx-10 py-0.5 sm:py-1 rounded uppercase shadow-[0_0_15px_rgba(239,68,68,0.8)]">Critical Spill</motion.div>}
      {percent < 30 && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-[9px] sm:text-[10px] text-amber-100 font-black tracking-widest mt-1.5 sm:mt-2 bg-amber-600/80 mx-4 sm:mx-10 py-0.5 sm:py-1 rounded uppercase shadow-[0_0_15px_rgba(245,158,11,0.8)]">Low Level</motion.div>}
    </div>

    {/* The Water Liquid */}
    <div className="w-full relative rounded-[20px] sm:rounded-[32px] overflow-hidden border border-white/10 bg-slate-900/50" style={{ height: '70%' }}>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: `${Math.min(100, percent)}%` }}
        transition={{ type: 'spring', bounce: 0.2, duration: 2 }}
        className={`absolute bottom-0 w-full rounded-b-[20px] sm:rounded-b-[32px] overflow-hidden ${
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
    <div className="relative w-40 sm:w-52 md:w-56 h-60 sm:h-72 md:h-80 border border-slate-700/50 rounded-[28px] sm:rounded-[40px] overflow-hidden shadow-2xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      <div className="text-center z-20 font-mono w-full">
        <span className="text-[9px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.3em] text-slate-400 font-bold uppercase">Network Integrity</span>
        <div className={`text-4xl sm:text-5xl md:text-6xl font-black mt-0.5 sm:mt-1 tracking-tighter drop-shadow-lg ${isFailing ? 'text-red-400' : 'text-emerald-400'}`}>
          {Math.round(health)}%
        </div>
      </div>
      
      <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center my-1 sm:mt-4">
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
        <div className={`z-20 p-2 sm:p-3 rounded-full backdrop-blur-md ${isFailing ? 'bg-red-900/80 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-emerald-900/80 shadow-[0_0_20px_rgba(16,185,129,0.6)]'}`}>
          {isFailing ? <WifiOff size={18} className="text-red-300 animate-pulse sm:w-6 sm:h-6" /> : <RadioTower size={18} className="text-emerald-300 sm:w-6 sm:h-6" />}
        </div>
      </div>

      <div className={`w-full py-1 sm:py-2 rounded-lg text-center font-bold text-[10px] sm:text-xs uppercase tracking-widest ${isFailing ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {isFailing ? 'Signal Lost' : 'Optimal'}
      </div>
    </div>
  );
};

// 3D Tilt Card Component with Accurate Cost Labels
interface ActionCardProps {
  action: any;
  bucket: number;
  isSelected: boolean;
  rankIndex?: number;
  isSingleSelect?: boolean;
  onClick: () => void;
}

const ActionCard = ({ action, bucket, isSelected, rankIndex = -1, isSingleSelect = false, onClick }: ActionCardProps) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouse(event: React.MouseEvent<HTMLButtonElement>) {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
      }
    }
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Cost Label & Validation Determination
  const canonicalAction = findAction(action.id, bucket) || action;
  const is3E = bucket === 3 && (action.id === '3E' || action.id === 'B3_ACT_5');
  const is4E = bucket === 4 && (action.id === '4E' || action.id === 'B4_ACT_5');

  let costLabel = '';
  let costBadgeClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
  let efficacyLabel = '';

  if (bucket === 3) {
    if (is3E) {
      costLabel = 'Cost: LKR 120M';
      costBadgeClass = 'text-red-400 bg-red-950/80 border-red-500/50';
      efficacyLabel = 'Breaches scenario limit — Invalid';
    } else {
      costLabel = 'Cost: LKR 100M';
      costBadgeClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
      efficacyLabel = isSelected ? 'Selected Plan' : 'Within scenario allocation limit';
    }
  } else if (bucket === 4) {
    if (is4E) {
      costLabel = 'No direct cost';
      costBadgeClass = 'text-cyan-300 bg-cyan-950/60 border-cyan-500/30';
      efficacyLabel = isSelected ? 'Selected Reserve Plan' : 'Held in Reserve';
    } else {
      costLabel = 'Cost: LKR 60M';
      costBadgeClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
      efficacyLabel = isSelected ? 'Selected Fleet Plan' : 'Mobilization Fee';
    }
  } else {
    const netBudget = canonicalAction.impacts?.emergencyBudget ?? action.impacts?.emergencyBudget ?? 0;
    if (netBudget < 0) {
      costLabel = `Cost: −LKR ${Math.abs(netBudget)}M`;
      costBadgeClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
    } else if (netBudget > 0) {
      costLabel = `Grant: +LKR ${netBudget}M`;
      costBadgeClass = 'text-cyan-300 bg-cyan-950/80 border-cyan-500/40 font-bold';
    } else {
      costLabel = 'No direct cost';
      costBadgeClass = 'text-slate-300 bg-slate-900/60 border-slate-700';
    }

    if (isSelected) {
      efficacyLabel = rankIndex === 0 ? 'Immediate (100%)' :
                      rankIndex === 1 ? 'Fast (85%)' :
                      rankIndex === 2 ? 'Standard (70%)' :
                      rankIndex === 3 ? 'Delayed (40%)' : 'Backlog (20%)';
    } else {
      efficacyLabel = 'Unassigned';
    }
  }

  return (
    <motion.button
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={{ scale: 0.96 }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onClick={onClick}
      className={`relative flex-shrink-0 w-[84vw] max-w-[320px] sm:w-[300px] md:w-[325px] min-h-[195px] rounded-2xl border text-left p-4 sm:p-5 transition-colors duration-300 snap-center group overflow-hidden touch-pan-x select-none ${
        isSelected
          ? is3E
            ? 'border-red-500 bg-red-950/60 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.4)]'
            : 'border-emerald-400 bg-emerald-950/60 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.3)]'
          : is3E
          ? 'border-red-900/50 bg-slate-900/60 backdrop-blur-md hover:border-red-500/60 hover:bg-red-950/20'
          : 'border-slate-700 bg-slate-900/60 backdrop-blur-md hover:bg-slate-800/80 hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]'
      }`}
    >
      {/* Dynamic Animated Glow */}
      {isSelected && (
        <motion.div 
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className={`absolute inset-0 rounded-2xl blur-xl -z-10 bg-[length:200%_200%] ${
            is3E
              ? 'bg-gradient-to-tr from-red-500/20 via-transparent to-red-400/10'
              : 'bg-gradient-to-tr from-emerald-500/20 via-transparent to-emerald-400/10'
          }`} 
        />
      )}

      {/* Cyberpunk Tech Lines */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${is3E ? 'via-red-400' : 'via-cyan-400'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} style={{ transform: 'translateZ(20px)' }}></div>
      <div className={`absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-transparent ${is3E ? 'via-red-400' : 'via-cyan-400'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} style={{ transform: 'translateZ(20px)' }}></div>

      <div className="flex justify-between items-start mb-3" style={{ transform: 'translateZ(30px)' }}>
        <div className={`p-2.5 rounded-xl backdrop-blur-md border ${
          isSelected 
            ? is3E 
              ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
              : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
            : is3E
            ? 'bg-red-950/40 border-red-800 text-red-400'
            : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50'
        }`}>
          {is3E ? <AlertTriangle size={18} /> : <Terminal size={18} />}
        </div>
        
        {/* Selection Badge */}
        <AnimatePresence>
          {isSingleSelect ? (
            isSelected ? (
              <motion.div
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-black shadow-lg text-sm ${
                  is3E ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.8)]'
                }`}
              >
                {is3E ? '✕' : <CheckCircle2 size={16} />}
              </motion.div>
            ) : is3E ? (
              <span className="text-[9px] font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/40">
                REJECTED
              </span>
            ) : (
              <span className="text-[9px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors uppercase font-bold">
                Select
              </span>
            )
          ) : (
            isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -180 }}
                className="w-8 h-8 rounded-full bg-emerald-400 text-black flex items-center justify-center font-black shadow-[0_0_20px_rgba(16,185,129,0.8)] text-lg"
              >
                {rankIndex + 1}
              </motion.div>
            )
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

      {/* Real Financial Cost & Priority / Status Efficacy */}
      <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono border-t border-slate-800/80 pt-2.5" style={{ transform: 'translateZ(30px)' }}>
        <span className={`font-bold px-2.5 py-0.5 rounded-md border text-[10px] sm:text-[11px] ${costBadgeClass}`}>
          {costLabel}
        </span>
        <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] truncate max-w-[140px] ${
          is3E 
            ? 'text-red-300 bg-red-950/80 border-red-500/40'
            : isSelected 
            ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/30' 
            : 'text-slate-500 border-transparent'
        }`}>
          {efficacyLabel}
        </span>
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
  
  // Operational Ranking Rounds (Buckets 1, 2, 5, 6)
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  
  // Day 4 (Fiscal Allocation, Bucket 3) State
  const [day4Mode, setDay4Mode] = useState<'preset' | 'custom'>('preset');
  const [day4PresetPlan, setDay4PresetPlan] = useState<string | null>(null);
  const [day4Custom, setDay4Custom] = useState<{
    evacuation: number;
    drinkingWater: number;
    medicalSupplies: number;
  }>({
    evacuation: 40,
    drinkingWater: 30,
    medicalSupplies: 30
  });

  // Day 6 (Emergency Fleet Distribution, Bucket 4) State
  const [day6Mode, setDay6Mode] = useState<'preset' | 'custom'>('preset');
  const [day6PresetPlan, setDay6PresetPlan] = useState<string | null>(null);
  const [day6Custom, setDay6Custom] = useState<{
    trucks_flood: number;
    trucks_dryzone: number;
    vehicles_flood: number;
    vehicles_dryzone: number;
    boats_flood: number;
    boats_dryzone: number;
  }>({
    trucks_flood: 8,
    trucks_dryzone: 12,
    vehicles_flood: 24,
    vehicles_dryzone: 6,
    boats_flood: 20,
    boats_dryzone: 0
  });

  const [submitting, setSubmitting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showBrief, setShowBrief] = useState(true);
  const [showFullSituation, setShowFullSituation] = useState(false);
  const [mobileMetricsOpen, setMobileMetricsOpen] = useState(false);

  // Preset Fleet Logistics Profiles
  const PRESET_FLEET_DISTRIBUTIONS: Record<string, { flood: number; dryZone: number; reserve: number; cost: number; title: string }> = {
    '4A': { flood: 52, dryZone: 18, reserve: 0, cost: 60, title: '8/12 trucks, 24/6 vehicles, 20/0 boats' },
    '4B': { flood: 50, dryZone: 20, reserve: 0, cost: 60, title: '0/20 trucks, 30/0 vehicles, 20/0 boats' },
    '4C': { flood: 35, dryZone: 35, reserve: 0, cost: 60, title: '10/10 trucks, 15/15 vehicles, 10/10 boats (50/50)' },
    '4D': { flood: 70, dryZone: 0, reserve: 0, cost: 60, title: '20/0 trucks, 30/0 vehicles, 20/0 boats (100% Flood)' },
    '4E': { flood: 0, dryZone: 0, reserve: 70, cost: 0, title: '0 deployed, 70 in reserve' },
  };

  useEffect(() => {
    if (!currentScenario) return;
    playRadarPing();
    setShowBrief(true);
    setShowFullSituation(false);

    if (voiceEnabled) {
      const fullBriefing = `Day ${state.day}. ${currentScenario.title}. ${currentScenario.situation}.`;
      speakText(fullBriefing);
    }

    return () => stopSpeaking();
  }, [state.bucket, currentScenario, state.day, voiceEnabled]);

  const formatLKR = (amount: number) => `${(amount).toFixed(0)}M`;

  // Toggle selection for operational 5-rank rounds
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

  // Day 4 Calculations
  const day4AllocatedTotal = day4Mode === 'preset'
    ? (day4PresetPlan === '3E' ? 120 : day4PresetPlan ? 100 : 0)
    : Math.max(0, (Number(day4Custom.evacuation) || 0) + (Number(day4Custom.drinkingWater) || 0) + (Number(day4Custom.medicalSupplies) || 0));

  const day4RemainingCapacity = Math.max(0, 100 - day4AllocatedTotal);
  const currentBudget = state.resources?.emergencyBudget ?? 500;
  const day4ProjectedTreasury = day4Mode === 'preset'
    ? (day4PresetPlan ? currentBudget - (day4PresetPlan === '3E' ? 120 : 100) : currentBudget)
    : currentBudget - day4AllocatedTotal;
  const day4RemainingCredit = day4ProjectedTreasury < 0 ? Math.max(0, 200 - Math.abs(day4ProjectedTreasury)) : 200;
  const day4HasNegative = day4Mode === 'custom' && (day4Custom.evacuation < 0 || day4Custom.drinkingWater < 0 || day4Custom.medicalSupplies < 0);
  const day4IsOverCap = day4AllocatedTotal > 100;
  const day4IsCreditBreached = day4ProjectedTreasury < -200;
  const day4Is3E = day4Mode === 'preset' && day4PresetPlan === '3E';

  // Day 6 Calculations
  const day6TrucksFlood = Math.max(0, Number(day6Custom.trucks_flood) || 0);
  const day6TrucksDry = Math.max(0, Number(day6Custom.trucks_dryzone) || 0);
  const day6VehiclesFlood = Math.max(0, Number(day6Custom.vehicles_flood) || 0);
  const day6VehiclesDry = Math.max(0, Number(day6Custom.vehicles_dryzone) || 0);
  const day6BoatsFlood = Math.max(0, Number(day6Custom.boats_flood) || 0);
  const day6BoatsDry = Math.max(0, Number(day6Custom.boats_dryzone) || 0);

  const day6TrucksTotal = day6TrucksFlood + day6TrucksDry;
  const day6VehiclesTotal = day6VehiclesFlood + day6VehiclesDry;
  const day6BoatsTotal = day6BoatsFlood + day6BoatsDry;
  const day6TotalDeployed = day6TrucksTotal + day6VehiclesTotal + day6BoatsTotal;

  const day6TrucksReserve = Math.max(0, 20 - day6TrucksTotal);
  const day6VehiclesReserve = Math.max(0, 30 - day6VehiclesTotal);
  const day6BoatsReserve = Math.max(0, 20 - day6BoatsTotal);

  const day6HasLimitViolation = day6Mode === 'custom' && (day6TrucksTotal > 20 || day6VehiclesTotal > 30 || day6BoatsTotal > 20);
  const day6HasNegative = day6Mode === 'custom' && (
    day6Custom.trucks_flood < 0 || day6Custom.trucks_dryzone < 0 ||
    day6Custom.vehicles_flood < 0 || day6Custom.vehicles_dryzone < 0 ||
    day6Custom.boats_flood < 0 || day6Custom.boats_dryzone < 0
  );

  const day6Cost = day6Mode === 'preset'
    ? (day6PresetPlan === '4E' ? 0 : day6PresetPlan ? 60 : 0)
    : (day6TotalDeployed > 0 ? 60 : 0);

  const day6ProjectedTreasury = day6Mode === 'preset'
    ? (day6PresetPlan ? currentBudget - day6Cost : currentBudget)
    : currentBudget - day6Cost;
  const day6RemainingCredit = day6ProjectedTreasury < 0 ? Math.max(0, 200 - Math.abs(day6ProjectedTreasury)) : 200;
  const day6IsCreditBreached = day6ProjectedTreasury < -200;

  // Operational Rounds (Buckets 1, 2, 5, 6) Calculations
  const operationalDrain = (() => {
    const top3 = selectedOrder.slice(0, 3);
    let netDrain = 0;
    top3.forEach(id => {
      const act = findAction(id, state.bucket) || currentScenario?.actions?.find((a: any) => a.id === id);
      if (act) {
        netDrain -= (act.impacts?.emergencyBudget ?? 0);
      }
    });
    return netDrain;
  })();
  const operationalProjectedTreasury = currentBudget - (selectedOrder.length > 0 ? operationalDrain : 0);
  const operationalRemainingCredit = operationalProjectedTreasury < 0 ? Math.max(0, 200 - Math.abs(operationalProjectedTreasury)) : 200;

  // Submit Handler
  const handleSubmitDecision = async () => {
    let payload: { rankings?: string[]; allocations?: Record<string, number> } = {};

    if (state.bucket === 3) {
      if (day4Mode === 'preset') {
        if (!day4PresetPlan) {
          alert('Please select a preset fiscal plan to authorize.');
          return;
        }
        if (day4PresetPlan === '3E') {
          alert('Plan 3E releases LKR 120M and breaches the statutory LKR 100M round limit. It must be rejected.');
          return;
        }
        payload = { rankings: [day4PresetPlan] };
      } else {
        if (day4HasNegative) {
          alert('Allocation amounts cannot be negative.');
          return;
        }
        if (day4AllocatedTotal > 100) {
          alert(`Budget allocation of LKR ${day4AllocatedTotal.toFixed(1)}M exceeds the scenario-defined LKR 100M emergency allocation ceiling.`);
          return;
        }
        if (day4AllocatedTotal <= 0) {
          alert('Please allocate emergency funds across sectors.');
          return;
        }
        if (day4IsCreditBreached) {
          alert('Projected borrowing exceeds the LKR 200M Emergency Credit Facility ceiling.');
          return;
        }
        payload = {
          allocations: {
            evacuation: day4Custom.evacuation,
            drinkingWater: day4Custom.drinkingWater,
            medicalSupplies: day4Custom.medicalSupplies
          }
        };
      }
    } else if (state.bucket === 4) {
      if (day6Mode === 'preset') {
        if (!day6PresetPlan) {
          alert('Please select a preset fleet plan to authorize.');
          return;
        }
        payload = { rankings: [day6PresetPlan] };
      } else {
        if (day6HasNegative) {
          alert('Fleet allocations cannot be negative.');
          return;
        }
        if (day6TrucksTotal > 20) {
          alert(`Truck allocation (${day6TrucksTotal}) exceeds national fleet limit of 20 heavy-duty trucks.`);
          return;
        }
        if (day6VehiclesTotal > 30) {
          alert(`Rescue vehicle allocation (${day6VehiclesTotal}) exceeds national fleet limit of 30 rescue vehicles.`);
          return;
        }
        if (day6BoatsTotal > 20) {
          alert(`Rescue boat allocation (${day6BoatsTotal}) exceeds national fleet limit of 20 rescue boats.`);
          return;
        }
        if (day6IsCreditBreached) {
          alert('Projected borrowing exceeds the LKR 200M Emergency Credit Facility ceiling.');
          return;
        }
        payload = {
          allocations: {
            trucks_flood: day6TrucksFlood,
            trucks_dryzone: day6TrucksDry,
            vehicles_flood: day6VehiclesFlood,
            vehicles_dryzone: day6VehiclesDry,
            boats_flood: day6BoatsFlood,
            boats_dryzone: day6BoatsDry
          }
        };
      }
    } else {
      if (selectedOrder.length !== 5) {
        alert('Please rank all 5 actions in priority order.');
        return;
      }
      payload = { rankings: selectedOrder };
    }

    setSubmitting(true);
    stopSpeaking();

    try {
      const res = await fetch('/api/game/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
          // Reset states for subsequent round
          setSelectedOrder([]);
          setDay4PresetPlan(null);
          setDay6PresetPlan(null);
          setDay4Mode('preset');
          setDay6Mode('preset');
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
        <div className="fixed inset-0 flex items-center justify-center gap-4 sm:gap-12 md:gap-24 lg:gap-32 pointer-events-none pb-28 sm:pb-32 px-2">
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ type: 'spring', bounce: 0.4, duration: 1.5 }}
            className="hover:scale-105 transition-transform duration-500 shrink-0"
          >
            <WaterTank percent={waterPercent} />
          </motion.div>
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ type: 'spring', bounce: 0.4, duration: 1.5, delay: 0.2 }}
            className="hover:scale-105 transition-transform duration-500 shrink-0"
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
        className="sticky top-0 inset-x-0 z-50 p-2 sm:p-4 md:p-6 flex flex-col gap-2 pointer-events-none safe-top"
      >
        <div className="flex justify-between items-center w-full">
          {/* Left: Day & Audio & Mobile HUD */}
          <div className="flex gap-2 sm:gap-3 pointer-events-auto items-center">
            <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-3.5 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <GlitchText text={`DAY ${state.day}`} className="text-xl sm:text-3xl md:text-4xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400" />
              <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-cyan-400 font-bold mt-0.5">SustainTech</span>
            </div>

            <button
              onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); playUIBlip(); }}
              className={`flex items-center justify-center h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border backdrop-blur-xl transition-all shadow-lg text-sm sm:text-base ${voiceEnabled ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-900/60 border-slate-700 text-slate-500 hover:border-slate-500'}`}
              title={voiceEnabled ? 'Mute advisor' : 'Unmute advisor'}
            >
              {voiceEnabled ? '🔊' : '🔈'}
            </button>

            {/* Mobile HUD Toggle Button */}
            <button
              onClick={() => { setMobileMetricsOpen(!mobileMetricsOpen); playUIBlip(); }}
              className={`lg:hidden flex items-center gap-1.5 h-9 px-2.5 rounded-xl border backdrop-blur-xl font-mono text-[11px] font-bold transition-all ${
                mobileMetricsOpen 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-cyan-500/50'
              }`}
              title="Toggle Metrics HUD"
            >
              <Activity size={14} className="text-cyan-400" />
              <span className="hidden xs:inline">HUD</span>
            </button>
          </div>

          {/* Right: Budget Display & Metrics */}
          <div className="flex gap-2 sm:gap-4 pointer-events-auto items-center">
            {/* Budget Display - Highly styled with deficit awareness */}
            <div className={`flex items-center gap-2 sm:gap-3.5 bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-3 border ${
              state.resources.emergencyBudget < 0
                ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.25)]'
                : state.resources.emergencyBudget === 0
                ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                : 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
            } relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 ${state.resources.emergencyBudget <= 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'} blur-2xl rounded-full`}></div>
              <div className={`${state.resources.emergencyBudget <= 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'} p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border shrink-0`}>
                <Coins size={18} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="flex flex-col items-end pr-1 sm:pr-2">
                <span className={`text-[8px] sm:text-[10px] font-mono font-bold tracking-wider sm:tracking-widest uppercase ${
                  state.resources.emergencyBudget < 0 ? 'text-red-400' : state.resources.emergencyBudget === 0 ? 'text-amber-400' : 'text-emerald-500/80'
                }`}>
                  {state.resources.emergencyBudget < 0 ? 'Credit Drawn' : 'Budget'}
                </span>
                <div className={`font-black font-mono text-base sm:text-2xl tracking-tight ${
                  state.resources.emergencyBudget < 0 
                    ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
                    : state.resources.emergencyBudget === 0
                    ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                }`}>
                  {state.resources.emergencyBudget < 0 ? `-LKR ${Math.abs(state.resources.emergencyBudget).toFixed(0)}M` : `LKR ${formatLKR(state.resources.emergencyBudget)}`}
                </div>
                {state.resources.emergencyBudget < 0 && (
                  <span className="text-[8px] sm:text-[9px] font-mono font-semibold text-amber-300/90 tracking-wide mt-0.5 hidden xs:inline">
                    {Math.max(0, 200 - Math.abs(state.resources.emergencyBudget)).toFixed(0)}M Avail
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics - Desktop Always */}
            <div className="hidden lg:flex flex-col gap-1.5">
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
                  className={`flex items-center justify-between w-44 xl:w-48 px-3 py-1 rounded-xl backdrop-blur-xl border bg-slate-900/80 shadow-lg ${metric.border} ${metric.text}`}
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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-red-500/30 text-red-400 backdrop-blur-xl transition-all hover:bg-red-950/80 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              title="Sign Out"
            >
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        {/* Mobile Metrics Drawer */}
        <AnimatePresence>
          {mobileMetricsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden pointer-events-auto bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-2.5 backdrop-blur-2xl shadow-2xl grid grid-cols-2 gap-2 mt-1"
            >
              {[
                { label: 'FLOOD', val: state.scores.floodPreparedness, icon: Navigation, border: 'border-blue-500/30', text: 'text-blue-400', bar: 'bg-blue-500' },
                { label: 'DROUGHT', val: state.scores.droughtPreparedness, icon: Droplets, border: 'border-amber-500/30', text: 'text-amber-400', bar: 'bg-amber-500' },
                { label: 'INTEL', val: state.information.informationQuality, icon: RadioTower, border: 'border-cyan-500/30', text: 'text-cyan-400', bar: 'bg-cyan-500' },
                { label: 'TRUST', val: state.community.communityTrust, icon: Users, border: 'border-purple-500/30', text: 'text-purple-400', bar: 'bg-purple-500' }
              ].map((metric) => (
                <div key={metric.label} className={`p-2 rounded-xl border bg-slate-900/90 ${metric.border} ${metric.text} flex flex-col gap-1`}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="flex items-center gap-1.5"><metric.icon size={11} /> {metric.label}</span>
                    <span>{Math.round(metric.val)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: `${Math.min(100, Math.max(0, metric.val))}%` }} className={`h-full ${metric.bar}`} />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Narrative HUD - Advisor Briefing */}
      <AnimatePresence>
        {showBrief && (
          <motion.div
            initial={{ x: -400, opacity: 0, rotateY: 30 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            exit={{ x: -400, opacity: 0, rotateY: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="fixed sm:absolute top-[75px] sm:top-[120px] md:top-[130px] left-3 right-3 sm:left-6 sm:right-auto md:left-8 z-40 max-w-xl perspective-[1000px]"
          >
            <div className="relative flex flex-col gap-2 sm:gap-3">
              {/* Advisor Avatar Pop-in with Collapse Action */}
              <motion.div 
                initial={{ y: 50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.3, type: "spring" }}
                className="flex items-end justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-end gap-3 sm:gap-4">
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 sm:border-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)] bg-black z-20 shrink-0">
                    <Image src="/assets/portrait_advisor.jpg" alt="Advisor" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay"></div>
                  </div>
                  <div className="bg-cyan-950/80 border border-cyan-500/50 px-3 sm:px-4 py-1 sm:py-1.5 rounded-t-xl rounded-br-xl backdrop-blur-md mb-1 shadow-lg">
                    <span className="text-cyan-400 font-black tracking-wider sm:tracking-widest text-[10px] sm:text-xs uppercase flex items-center gap-1.5 sm:gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Priority Scenario Briefing
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowBrief(false)} 
                  className="mb-1 text-xs font-mono font-bold text-cyan-300 hover:text-white bg-slate-900/90 border border-cyan-500/40 px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5 hover:bg-slate-800 transition-all"
                  title="Minimize briefing to focus on allocation decisions"
                >
                  <ChevronUp size={14} />
                  <span>Minimize</span>
                </button>
              </motion.div>

              {/* Message Box */}
              <motion.div 
                className="relative bg-slate-900/95 backdrop-blur-2xl border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl overflow-hidden sm:ml-6 md:ml-8 z-10 max-h-[55vh] sm:max-h-[65vh] overflow-y-auto"
                style={{ scrollbarWidth: 'thin' }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none"></div>
                
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">{currentScenario.title}</h2>
                  <button onClick={() => setShowBrief(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-full hover:bg-red-500/20 hover:text-red-400 shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>

                <div 
                  onClick={() => setShowFullSituation(true)} 
                  className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed min-h-[50px] cursor-pointer select-text"
                  title="Click to instantly reveal full text"
                >
                  {showFullSituation ? (
                    <p className="whitespace-pre-line">{currentScenario.situation}</p>
                  ) : (
                    <Typewriter 
                      text={currentScenario.situation} 
                      speed={12} 
                      onComplete={() => setShowFullSituation(true)} 
                    />
                  )}
                </div>
                {!showFullSituation && (
                  <button 
                    onClick={() => setShowFullSituation(true)} 
                    className="mt-1 text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300 underline"
                  >
                    Click to show full text immediately
                  </button>
                )}

                {currentScenario.events && currentScenario.events.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 pt-2.5 border-t border-slate-800">
                    <div className="flex flex-col gap-1.5">
                      {currentScenario.events.map((ev: string, i: number) => (
                        <div key={i} className="text-[10px] sm:text-[11px] font-mono text-cyan-200/90 flex items-start gap-2">
                          <span className="text-cyan-400 mt-0.5">•</span>
                          <span>{ev}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Bottom Dismiss / Proceed Button */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 hidden xs:inline">
                    Read situation, then proceed to allocation below
                  </span>
                  <button
                    onClick={() => {
                      setShowBrief(false);
                      playUIBlip();
                    }}
                    className="w-full xs:w-auto px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ml-auto shadow-md"
                  >
                    <span>Proceed to Allocation & Decisions</span>
                    <ChevronDown size={14} />
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showBrief && (
        <motion.button
          initial={{ scale: 0, x: -50 }}
          animate={{ scale: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            setShowBrief(true);
            setShowFullSituation(true);
            playUIBlip();
          }}
          className="fixed sm:absolute top-[80px] sm:top-[130px] md:top-[140px] left-3 sm:left-6 md:left-8 z-40 bg-slate-900/95 border border-cyan-500/40 text-cyan-400 p-1.5 sm:p-2 rounded-2xl backdrop-blur-xl hover:bg-slate-800 transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-2.5 sm:gap-3 pr-3.5 sm:pr-4 group"
        >
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            <Image src="/assets/portrait_advisor.jpg" alt="Advisor" fill className="object-cover" unoptimized />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
              <span>Scenario Briefing</span>
              <span className="text-cyan-400 text-[9px] font-mono font-normal">Day {state.day}</span>
            </span>
            <span className="text-[9px] font-mono text-cyan-400/80">Click to expand briefing</span>
          </div>
        </motion.button>
      )}

      {/* Submission Overlay HUD */}
      <AnimatePresence>
        {submitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center font-mono p-4 text-center"
          >
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-500 opacity-50"></motion.div>
              <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-4 rounded-full border-b-2 border-l-2 border-emerald-500 opacity-50"></motion.div>
              <span className="text-xl sm:text-2xl font-black text-white tracking-[0.2em] animate-pulse">EXECUTING</span>
            </div>
            <p className="mt-6 sm:mt-8 text-cyan-400 tracking-wider sm:tracking-[0.3em] text-xs sm:text-sm px-4">TRANSMITTING DIRECTIVES TO FIELD UNITS...</p>
            <motion.div className="w-64 sm:w-96 h-1 bg-slate-800 mt-4 rounded-full overflow-hidden">
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
        className="relative md:sticky bottom-0 inset-x-0 min-h-[300px] sm:min-h-[350px] bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent z-40 flex flex-col justify-end pb-4 sm:pb-8 pt-3 sm:pt-4 px-3 sm:px-6 md:px-10 mt-auto safe-bottom"
      >
        {/* Active Dynamic Events Alert Banner */}
        {state.activeDynamicEvents && state.activeDynamicEvents.length > 0 && (
          <div className="mb-2 max-h-16 overflow-y-auto flex flex-wrap gap-1.5 sm:gap-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
            {state.activeDynamicEvents.map((evt: any, i: number) => (
              <div 
                key={i} 
                className={`px-2.5 py-0.5 sm:py-1 rounded-lg border font-mono text-[9px] sm:text-[10px] flex items-center gap-1.5 backdrop-blur-xl shadow-md ${
                  evt.impactType === 'positive' 
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' 
                    : evt.impactType === 'warning'
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                    : 'bg-red-950/70 border-red-500/50 text-red-300'
                }`}
              >
                <span className="font-bold uppercase tracking-wider">{evt.title}:</span>
                <span className="text-slate-300 truncate max-w-[220px] sm:max-w-none">{evt.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* DAY 4: FISCAL ALLOCATION CONTROLS & SUMMARY TRAY                          */}
        {/* ========================================================================= */}
        {state.bucket === 3 && (
          <div className="mb-3 sm:mb-4 bg-slate-900/95 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl">
            {/* Header with Title and Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                    <Coins size={16} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                    Day 4 — Fiscal Allocation
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded-full">
                    Cap: LKR 100M
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">
                  Three sectors require LKR 120M total. Available round limit is LKR 100M.
                </span>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  id="day4-mode-preset"
                  onClick={() => { setDay4Mode('preset'); playUIBlip(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    day4Mode === 'preset'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers size={13} />
                  <span>Preset Plans</span>
                </button>
                <button
                  id="day4-mode-custom"
                  onClick={() => { setDay4Mode('custom'); playUIBlip(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    day4Mode === 'custom'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders size={13} />
                  <span>Custom Allocation</span>
                </button>
              </div>
            </div>

            {/* Financial Accounting Bar (Requirement 6) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 py-3 border-b border-slate-800 text-[10px] sm:text-xs font-mono">
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">
                  {day4Mode === 'preset' ? 'Selected Preset Plan' : 'Allocated Total'}
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base sm:text-lg font-black ${
                    day4Mode === 'preset' && !day4PresetPlan 
                      ? 'text-slate-500' 
                      : day4IsOverCap 
                      ? 'text-red-400' 
                      : 'text-emerald-400'
                  }`}>
                    {day4Mode === 'preset' 
                      ? (day4PresetPlan ? `Plan ${day4PresetPlan} (LKR ${day4AllocatedTotal}M)` : '—') 
                      : `LKR ${day4AllocatedTotal.toFixed(0)}M`}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    day4Mode === 'preset' && !day4PresetPlan
                      ? 'bg-slate-900 text-slate-400'
                      : day4IsOverCap 
                      ? 'bg-red-950 text-red-300' 
                      : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {day4Mode === 'preset' && !day4PresetPlan ? 'Select Plan' : '/ 100M Cap'}
                  </span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">
                  {day4Mode === 'preset' ? 'Scenario Allocation Cap' : 'Remaining Capacity'}
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base sm:text-lg font-black ${
                    day4Mode === 'preset'
                      ? 'text-cyan-400'
                      : day4RemainingCapacity === 0 
                      ? 'text-amber-300' 
                      : 'text-cyan-400'
                  }`}>
                    {day4Mode === 'preset'
                      ? (day4PresetPlan ? (day4PresetPlan === '3E' ? 'Breached (120M)' : 'LKR 0M Remaining') : 'LKR 100M Limit')
                      : `LKR ${day4RemainingCapacity.toFixed(0)}M`}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {day4Mode === 'preset' ? 'scenario rule' : 'allowance'}
                  </span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Treasury Balance</span>
                  <span className="text-slate-500 text-[8px] font-semibold">Actual: LKR {currentBudget}M</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base sm:text-lg font-black ${
                    day4ProjectedTreasury < 0 ? 'text-red-400' : day4ProjectedTreasury === 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {day4Mode === 'preset' && !day4PresetPlan
                      ? `LKR ${currentBudget}M`
                      : day4ProjectedTreasury < 0 
                      ? `-LKR ${Math.abs(day4ProjectedTreasury).toFixed(0)}M` 
                      : `LKR ${day4ProjectedTreasury.toFixed(0)}M`}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    day4Mode === 'preset' && !day4PresetPlan
                      ? 'bg-slate-900 text-slate-400'
                      : day4ProjectedTreasury < 0 
                      ? 'bg-red-950 text-red-300' 
                      : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {day4Mode === 'preset' && !day4PresetPlan ? 'Current' : day4ProjectedTreasury < 0 ? 'Deficit' : 'Projected'}
                  </span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">Credit Availability</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base sm:text-lg font-black ${day4RemainingCredit < 50 ? 'text-red-400' : 'text-amber-300'}`}>
                    LKR {day4RemainingCredit.toFixed(0)}M
                  </span>
                  <span className="text-[9px] text-slate-500">of 200M cap</span>
                </div>
              </div>
            </div>

            {/* Deficit / Limit Violation Warnings */}
            {(day4IsOverCap || day4Is3E || day4ProjectedTreasury < 0 || day4HasNegative) && (
              <div className="mt-2.5 p-2.5 rounded-xl font-mono text-[10px] sm:text-[11px] flex flex-col gap-1 border">
                {day4Is3E && (
                  <div className="text-red-400 bg-red-950/70 p-1.5 rounded-lg border border-red-500/40 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span><strong>PLAN 3E REJECTED:</strong> Releases LKR 120M and breaches the scenario LKR 100M allocation limit. This plan cannot be authorized.</span>
                  </div>
                )}
                {day4IsOverCap && !day4Is3E && (
                  <div className="text-red-400 bg-red-950/70 p-1.5 rounded-lg border border-red-500/40 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span><strong>ROUND CAP EXCEEDED:</strong> Total allocation (LKR {day4AllocatedTotal.toFixed(0)}M) exceeds the LKR 100M limit by LKR {(day4AllocatedTotal - 100).toFixed(0)}M.</span>
                  </div>
                )}
                {day4HasNegative && (
                  <div className="text-red-400 bg-red-950/70 p-1.5 rounded-lg border border-red-500/40 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span><strong>INVALID AMOUNTS:</strong> Allocations cannot be negative.</span>
                  </div>
                )}
                {day4ProjectedTreasury < 0 && (
                  <div className="text-amber-300 bg-amber-950/70 p-1.5 rounded-lg border border-amber-500/40 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span><strong>DEFICIT WARNING:</strong> Spending drives provincial reserves into negative balance (-LKR {Math.abs(day4ProjectedTreasury).toFixed(0)}M). Drawing from Emergency Credit Facility incurs the fiscal insolvency deduction (-12 pts CPS).</span>
                  </div>
                )}
              </div>
            )}

            {/* Day 4 Custom Allocation Header */}
            {day4Mode === 'custom' && (
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={13} className="text-cyan-400" />
                  Current Draft Allocation (Pending Authorization)
                </span>
                <span className="text-slate-400 text-[10px]">Adjust values below, then click Authorize</span>
              </div>
            )}

            {/* Day 4 Custom Allocation Sector Inputs */}
            {day4Mode === 'custom' && (
              <div className="mt-3.5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Evacuation Support */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Navigation size={13} className="text-cyan-400" />
                          Evacuation Support
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded">
                          Need: 40M
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mb-2">
                        Kelani flood basin levee evacuation & shelter transport
                      </p>
                    </div>

                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-2">
                        <input
                          id="custom-slider-evacuation"
                          type="range"
                          min={0}
                          max={60}
                          step={1}
                          value={day4Custom.evacuation}
                          onChange={(e) => setDay4Custom(prev => ({ ...prev, evacuation: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            id="custom-input-evacuation"
                            type="number"
                            min={0}
                            max={100}
                            value={day4Custom.evacuation}
                            onChange={(e) => setDay4Custom(prev => ({ ...prev, evacuation: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right font-mono text-xs font-bold text-white"
                          />
                          <span className="text-[10px] font-mono text-slate-400">M</span>
                        </div>
                      </div>

                      <div className="flex gap-1 justify-between text-[9px] font-mono text-slate-400 pt-1">
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, evacuation: 0 }))} className="px-1.5 py-0.5 rounded bg-slate-800 hover:text-white">0M</button>
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, evacuation: 20 }))} className="px-1.5 py-0.5 rounded bg-slate-800 hover:text-white">20M</button>
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, evacuation: 40 }))} className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold hover:bg-cyan-900">40M (100%)</button>
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, evacuation: 60 }))} className="px-1.5 py-0.5 rounded bg-slate-800 hover:text-white">60M</button>
                      </div>
                    </div>
                  </div>

                  {/* Drinking Water */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Droplets size={13} className="text-amber-400" />
                          Drinking Water Delivery
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded">
                          Need: 50M
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mb-2">
                        Dry Zone emergency water bowsers & well rehabilitation
                      </p>
                    </div>

                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-2">
                        <input
                          id="custom-slider-water"
                          type="range"
                          min={0}
                          max={60}
                          step={1}
                          value={day4Custom.drinkingWater}
                          onChange={(e) => setDay4Custom(prev => ({ ...prev, drinkingWater: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            id="custom-input-water"
                            type="number"
                            min={0}
                            max={100}
                            value={day4Custom.drinkingWater}
                            onChange={(e) => setDay4Custom(prev => ({ ...prev, drinkingWater: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right font-mono text-xs font-bold text-white"
                          />
                          <span className="text-[10px] font-mono text-slate-400">M</span>
                        </div>
                      </div>

                      <div className="flex gap-1 justify-between text-[9px] font-mono text-slate-400 pt-1">
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, drinkingWater: 0 }))} className="px-1.5 py-0.5 rounded bg-slate-800 hover:text-white">0M</button>
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, drinkingWater: 25 }))} className="px-1.5 py-0.5 rounded bg-slate-800 hover:text-white">25M</button>
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, drinkingWater: 50 }))} className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold hover:bg-amber-900">50M (100%)</button>
                      </div>
                    </div>
                  </div>

                  {/* Medical Supplies */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <ShieldAlert size={13} className="text-emerald-400" />
                          Emergency Medical Supplies
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded">
                          Need: 30M
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mb-2">
                        Mobile triage clinics & critical medicine buffer
                      </p>
                    </div>

                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-2">
                        <input
                          id="custom-slider-medical"
                          type="range"
                          min={0}
                          max={60}
                          step={1}
                          value={day4Custom.medicalSupplies}
                          onChange={(e) => setDay4Custom(prev => ({ ...prev, medicalSupplies: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full accent-emerald-400 cursor-pointer"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            id="custom-input-medical"
                            type="number"
                            min={0}
                            max={100}
                            value={day4Custom.medicalSupplies}
                            onChange={(e) => setDay4Custom(prev => ({ ...prev, medicalSupplies: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right font-mono text-xs font-bold text-white"
                          />
                          <span className="text-[10px] font-mono text-slate-400">M</span>
                        </div>
                      </div>

                      <div className="flex gap-1 justify-between text-[9px] font-mono text-slate-400 pt-1">
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, medicalSupplies: 0 }))} className="px-1.5 py-0.5 rounded bg-slate-800 hover:text-white">0M</button>
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, medicalSupplies: 15 }))} className="px-1.5 py-0.5 rounded bg-slate-800 hover:text-white">15M</button>
                        <button onClick={() => setDay4Custom(prev => ({ ...prev, medicalSupplies: 30 }))} className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold hover:bg-emerald-900">30M (100%)</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Presets Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono">
                  <span className="text-slate-400 font-bold">Quick Presets:</span>
                  <button
                    onClick={() => setDay4Custom({ evacuation: 40, drinkingWater: 30, medicalSupplies: 30 })}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 transition-colors"
                  >
                    Balanced (40 / 30 / 30)
                  </button>
                  <button
                    onClick={() => setDay4Custom({ evacuation: 30, drinkingWater: 40, medicalSupplies: 30 })}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 transition-colors"
                  >
                    Water Focus (30 / 40 / 30)
                  </button>
                  <button
                    onClick={() => setDay4Custom({ evacuation: 50, drinkingWater: 30, medicalSupplies: 20 })}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 transition-colors"
                  >
                    Evac Focus (50 / 30 / 20)
                  </button>
                  <button
                    onClick={() => setDay4Custom({ evacuation: 0, drinkingWater: 0, medicalSupplies: 0 })}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 transition-colors"
                  >
                    Reset (0 / 0 / 0)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* DAY 6: FLEET DISTRIBUTION CONTROLS & SUMMARY TRAY                         */}
        {/* ========================================================================= */}
        {state.bucket === 4 && (
          <div className="mb-3 sm:mb-4 bg-slate-900/95 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl">
            {/* Header with Title and Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                    <Truck size={16} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                    Day 6 — Emergency Fleet Distribution
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded-full">
                    Pool: 20 Trucks, 30 Vehicles, 20 Boats
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">
                  Deploy national transport fleets. Non-reserve deployment incurs an LKR 60M fee; Plan 4E costs LKR 0M.
                </span>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  id="day6-mode-preset"
                  onClick={() => { setDay6Mode('preset'); playUIBlip(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    day6Mode === 'preset'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers size={13} />
                  <span>Preset Fleet Plans</span>
                </button>
                <button
                  id="day6-mode-custom"
                  onClick={() => { setDay6Mode('custom'); playUIBlip(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    day6Mode === 'custom'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders size={13} />
                  <span>Custom Fleet Allocation</span>
                </button>
              </div>
            </div>

            {/* Fleet & Cost Accounting Bar (Requirement 6) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 py-3 border-b border-slate-800 text-[10px] sm:text-xs font-mono">
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">
                  {day6Mode === 'preset' ? 'Fleet Distribution' : 'Draft Fleet Deployment'}
                </span>
                {day6Mode === 'preset' && !day6PresetPlan ? (
                  <div className="flex flex-col gap-0.5 mt-1 text-[10px]">
                    <span className="text-slate-400 font-bold">No fleet plan selected</span>
                    <span className="text-slate-500 text-[9px]">Select a preset plan from cards below</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5 mt-1 text-[10px] font-bold">
                    <span className="text-blue-300">
                      Flood: {day6Mode === 'preset' 
                        ? (PRESET_FLEET_DISTRIBUTIONS[day6PresetPlan!]?.flood ?? 0) 
                        : (day6TrucksFlood + day6VehiclesFlood + day6BoatsFlood)} units
                    </span>
                    <span className="text-amber-300">
                      Dry Zone: {day6Mode === 'preset' 
                        ? (PRESET_FLEET_DISTRIBUTIONS[day6PresetPlan!]?.dryZone ?? 0) 
                        : (day6TrucksDry + day6VehiclesDry + day6BoatsDry)} units
                    </span>
                    <span className="text-slate-400">
                      Reserve: {day6Mode === 'preset' 
                        ? (PRESET_FLEET_DISTRIBUTIONS[day6PresetPlan!]?.reserve ?? 0) 
                        : (day6TrucksReserve + day6VehiclesReserve + day6BoatsReserve)} units
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">
                  {day6Mode === 'preset' ? 'Mobilization Cost' : 'Draft Deployment Cost'}
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base sm:text-lg font-black ${
                    day6Mode === 'preset' && !day6PresetPlan 
                      ? 'text-slate-500' 
                      : day6Cost === 0 
                      ? 'text-cyan-300' 
                      : 'text-emerald-400'
                  }`}>
                    {day6Mode === 'preset' && !day6PresetPlan ? '—' : `LKR ${day6Cost}M`}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    day6Mode === 'preset' && !day6PresetPlan
                      ? 'bg-slate-900 text-slate-400'
                      : day6Cost === 0 
                      ? 'bg-cyan-950 text-cyan-300' 
                      : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {day6Mode === 'preset' && !day6PresetPlan 
                      ? 'Select Plan' 
                      : day6Cost === 0 
                      ? '0M Reserve' 
                      : '60M Fee'}
                  </span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Treasury Balance</span>
                  <span className="text-slate-500 text-[8px] font-semibold">Actual: LKR {currentBudget}M</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base sm:text-lg font-black ${
                    day6ProjectedTreasury < 0 ? 'text-red-400' : day6ProjectedTreasury === 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {day6Mode === 'preset' && !day6PresetPlan
                      ? `LKR ${currentBudget}M`
                      : day6ProjectedTreasury < 0 
                      ? `-LKR ${Math.abs(day6ProjectedTreasury).toFixed(0)}M` 
                      : `LKR ${day6ProjectedTreasury.toFixed(0)}M`}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    day6Mode === 'preset' && !day6PresetPlan
                      ? 'bg-slate-900 text-slate-400'
                      : day6ProjectedTreasury < 0 
                      ? 'bg-red-950 text-red-300' 
                      : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {day6Mode === 'preset' && !day6PresetPlan ? 'Current' : day6ProjectedTreasury < 0 ? 'Deficit' : 'Projected'}
                  </span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">Credit Availability</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base sm:text-lg font-black ${day6RemainingCredit < 50 ? 'text-red-400' : 'text-amber-300'}`}>
                    LKR {day6RemainingCredit.toFixed(0)}M
                  </span>
                  <span className="text-[9px] text-slate-500">of 200M cap</span>
                </div>
              </div>
            </div>

            {/* Warnings Bar */}
            {(day6HasLimitViolation || day6ProjectedTreasury < 0 || day6HasNegative) && (
              <div className="mt-2.5 p-2.5 rounded-xl font-mono text-[10px] sm:text-[11px] flex flex-col gap-1 border">
                {day6HasLimitViolation && (
                  <div className="text-red-400 bg-red-950/70 p-1.5 rounded-lg border border-red-500/40 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span><strong>STOCKPILE LIMIT VIOLATION:</strong> Fleet deployment exceeds available national pool (Trucks &le; 20, Vehicles &le; 30, Boats &le; 20).</span>
                  </div>
                )}
                {day6HasNegative && (
                  <div className="text-red-400 bg-red-950/70 p-1.5 rounded-lg border border-red-500/40 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span><strong>INVALID AMOUNTS:</strong> Fleet unit numbers cannot be negative.</span>
                  </div>
                )}
                {day6ProjectedTreasury < 0 && (
                  <div className="text-amber-300 bg-amber-950/70 p-1.5 rounded-lg border border-amber-500/40 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span><strong>DEFICIT WARNING:</strong> Mobilization fee drives treasury into overdraft (-LKR {Math.abs(day6ProjectedTreasury).toFixed(0)}M). Remaining borrowing facility: LKR {day6RemainingCredit.toFixed(0)}M.</span>
                  </div>
                )}
              </div>
            )}

            {/* Day 6 Custom Fleet Draft Label */}
            {day6Mode === 'custom' && (
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={13} className="text-cyan-400" />
                  Current Draft Allocation (Pending Authorization)
                </span>
                <span className="text-slate-400 text-[10px]">Adjust units per zone below, then click Authorize</span>
              </div>
            )}

            {/* Day 6 Custom Fleet Allocation Inputs */}
            {day6Mode === 'custom' && (
              <div className="mt-3.5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Heavy-Duty Trucks */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Truck size={13} className="text-cyan-400" />
                          Heavy-Duty Trucks
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          Pool: 20
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-cyan-300 flex items-center justify-between mb-2">
                        <span>Deployed: {day6TrucksTotal}</span>
                        <span className="font-bold text-emerald-400">Reserve: {day6TrucksReserve}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mt-1 font-mono text-[11px]">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Kelani Flood Zone:</span>
                          <span className="text-white font-bold">{day6TrucksFlood}</span>
                        </div>
                        <input
                          id="custom-trucks-flood"
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={day6TrucksFlood}
                          onChange={(e) => setDay6Custom(prev => ({ ...prev, trucks_flood: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Dry Zone (Water Bowsers):</span>
                          <span className="text-white font-bold">{day6TrucksDry}</span>
                        </div>
                        <input
                          id="custom-trucks-dryzone"
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={day6TrucksDry}
                          onChange={(e) => setDay6Custom(prev => ({ ...prev, trucks_dryzone: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rescue Vehicles */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Activity size={13} className="text-emerald-400" />
                          Rescue Vehicles
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          Pool: 30
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-300 flex items-center justify-between mb-2">
                        <span>Deployed: {day6VehiclesTotal}</span>
                        <span className="font-bold text-emerald-400">Reserve: {day6VehiclesReserve}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mt-1 font-mono text-[11px]">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Kelani Flood Zone:</span>
                          <span className="text-white font-bold">{day6VehiclesFlood}</span>
                        </div>
                        <input
                          id="custom-vehicles-flood"
                          type="range"
                          min={0}
                          max={30}
                          step={1}
                          value={day6VehiclesFlood}
                          onChange={(e) => setDay6Custom(prev => ({ ...prev, vehicles_flood: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full accent-emerald-400 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Dry Zone:</span>
                          <span className="text-white font-bold">{day6VehiclesDry}</span>
                        </div>
                        <input
                          id="custom-vehicles-dryzone"
                          type="range"
                          min={0}
                          max={30}
                          step={1}
                          value={day6VehiclesDry}
                          onChange={(e) => setDay6Custom(prev => ({ ...prev, vehicles_dryzone: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rescue Boats */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Ship size={13} className="text-blue-400" />
                          Rescue Boats
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          Pool: 20
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-blue-300 flex items-center justify-between mb-2">
                        <span>Deployed: {day6BoatsTotal}</span>
                        <span className="font-bold text-emerald-400">Reserve: {day6BoatsReserve}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mt-1 font-mono text-[11px]">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Kelani Flood Zone:</span>
                          <span className="text-white font-bold">{day6BoatsFlood}</span>
                        </div>
                        <input
                          id="custom-boats-flood"
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={day6BoatsFlood}
                          onChange={(e) => setDay6Custom(prev => ({ ...prev, boats_flood: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full accent-blue-400 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Dry Zone:</span>
                          <span className="text-white font-bold">{day6BoatsDry}</span>
                        </div>
                        <input
                          id="custom-boats-dryzone"
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={day6BoatsDry}
                          onChange={(e) => setDay6Custom(prev => ({ ...prev, boats_dryzone: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full accent-slate-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Presets Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono">
                  <span className="text-slate-400 font-bold">Quick Presets:</span>
                  <button
                    onClick={() => setDay6Custom({ trucks_flood: 8, trucks_dryzone: 12, vehicles_flood: 24, vehicles_dryzone: 6, boats_flood: 20, boats_dryzone: 0 })}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 transition-colors"
                  >
                    Optimal 4A (8/12 T, 24/6 V, 20/0 B)
                  </button>
                  <button
                    onClick={() => setDay6Custom({ trucks_flood: 0, trucks_dryzone: 20, vehicles_flood: 30, vehicles_dryzone: 0, boats_flood: 20, boats_dryzone: 0 })}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 transition-colors"
                  >
                    Specialized 4B (0/20 T, 30/0 V, 20/0 B)
                  </button>
                  <button
                    onClick={() => setDay6Custom({ trucks_flood: 10, trucks_dryzone: 10, vehicles_flood: 15, vehicles_dryzone: 15, boats_flood: 10, boats_dryzone: 10 })}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 transition-colors"
                  >
                    Equal Split (10/10, 15/15, 10/10)
                  </button>
                  <button
                    onClick={() => setDay6Custom({ trucks_flood: 0, trucks_dryzone: 0, vehicles_flood: 0, vehicles_dryzone: 0, boats_flood: 0, boats_dryzone: 0 })}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-400 transition-colors"
                  >
                    Hold All in Reserve (0M fee)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* OPERATIONAL RANKING ROUNDS (BUCKETS 1, 2, 5, 6) SUMMARY TRAY              */}
        {/* ========================================================================= */}
        {state.bucket !== 3 && state.bucket !== 4 && selectedOrder.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 sm:mb-4 bg-slate-900/95 border border-slate-700/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-[11px] sm:text-xs font-mono text-cyan-400 uppercase tracking-wider sm:tracking-widest font-black flex items-center gap-1.5">
                  <Terminal size={14} /> Priority Sequence:
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                  Ranks 1–3 Execute | Ranks 4–5 Standby
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-mono justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Actual Treasury:</span>
                  <span className="font-bold text-white">LKR {currentBudget}M</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Top-3 Net Impact:</span>
                  <span className={`font-black ${operationalDrain > 0 ? 'text-amber-400' : operationalDrain < 0 ? 'text-cyan-300' : 'text-slate-300'}`}>
                    {selectedOrder.length >= 3 
                      ? operationalDrain > 0 ? `−LKR ${operationalDrain}M` : operationalDrain < 0 ? `+LKR ${Math.abs(operationalDrain)}M (Grant)` : 'LKR 0M'
                      : '— (Select Top 3)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Projected:</span>
                  <span className={`font-black ${operationalProjectedTreasury < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {operationalProjectedTreasury < 0 ? `-LKR ${Math.abs(operationalProjectedTreasury)}M` : `LKR ${operationalProjectedTreasury}M`}
                  </span>
                  {operationalProjectedTreasury < 0 && (
                    <span className="text-[9px] text-red-300 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-500/40">
                      {operationalRemainingCredit}M Avail of 200M Cap
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOrder([])}
                  className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 hover:text-red-400 bg-slate-800/80 hover:bg-red-950/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-700 transition-colors ml-auto sm:ml-0"
                >
                  <RotateCcw size={11} /> Clear
                </button>
              </div>
            </div>

            {/* 5 Ordered Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2.5">
              {[0, 1, 2, 3, 4].map((slotIdx) => {
                const actionId = selectedOrder[slotIdx];
                const action = actionId ? (findAction(actionId, state.bucket) || currentScenario?.actions?.find((a: any) => a.id === actionId)) : null;
                const isExecuting = slotIdx < 3;
                const netBudget = action?.impacts?.emergencyBudget ?? 0;
                
                return (
                  <div
                    key={slotIdx}
                    className={`relative p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      action 
                        ? isExecuting
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-slate-950/50 border-slate-700/60 opacity-60'
                        : 'bg-black/30 border-dashed border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] sm:text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                        isExecuting ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Rank {slotIdx + 1}
                      </span>
                      <span className={`text-[8px] sm:text-[9px] font-mono uppercase font-bold tracking-wider ${
                        isExecuting ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {isExecuting ? 'Executes' : 'Standby'}
                      </span>
                    </div>

                    {action ? (
                      <div>
                        <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs text-white">
                          <span className="text-cyan-400 font-mono text-[10px]">[{action.id}]</span>
                          <span className="truncate">{action.title}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-slate-400">
                          <span className="truncate font-semibold">
                            {netBudget < 0 
                              ? `Cost: −LKR ${Math.abs(netBudget)}M`
                              : netBudget > 0
                              ? `Grant: +LKR ${netBudget}M`
                              : 'No direct cost'}
                          </span>
                          <button
                            onClick={() => toggleSelection(action.id)}
                            className="text-slate-500 hover:text-red-400 p-0.5 ml-1"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 italic py-1 sm:py-2">
                        Tap card below...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* ACTION CARDS TRACK & AUTHORIZE SUBMIT BUTTON                              */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-start">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-[0.2em] text-slate-300 flex items-center gap-2 sm:gap-3 truncate">
              <span className="truncate">
                {state.bucket === 3 
                  ? day4Mode === 'preset' ? 'Select One Preset Plan' : 'Custom Sector Inputs'
                  : state.bucket === 4 
                  ? day6Mode === 'preset' ? 'Select One Fleet Plan' : 'Custom Fleet Logistics'
                  : 'Priority Directives'}
              </span>
              {state.bucket !== 3 && state.bucket !== 4 && (
                <span className="text-white bg-slate-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border border-slate-700 shadow-inner text-xs font-mono shrink-0">
                  {selectedOrder.length}/5
                </span>
              )}
            </h3>

            {state.bucket !== 3 && state.bucket !== 4 && selectedOrder.length < 5 && (
              <span className="text-[10px] sm:text-xs text-cyan-400 animate-pulse font-mono border border-cyan-500/30 bg-cyan-500/10 px-2 sm:px-3 py-1 rounded-full tracking-wider sm:tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.2)] shrink-0">
                NEED {5 - selectedOrder.length}
              </span>
            )}
          </div>

          {/* Authorize Action Button */}
          <AnimatePresence>
            {state.bucket === 3 ? (
              <motion.button
                id="day4-authorize-btn"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.02, boxShadow: "0px 0px 40px rgba(16,185,129,0.5)" }}
                whileTap={{ scale: 0.96 }}
                disabled={submitting || (
                  day4Mode === 'preset'
                    ? (!day4PresetPlan || day4PresetPlan === '3E')
                    : (day4AllocatedTotal <= 0 || day4AllocatedTotal > 100 || day4HasNegative || day4IsCreditBreached)
                )}
                onClick={handleSubmitDecision}
                className={`px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl font-black uppercase tracking-wider sm:tracking-[0.2em] flex items-center justify-center gap-3 transition-colors shadow-lg overflow-hidden relative group w-full sm:w-auto ${
                  (day4Mode === 'preset' ? (!day4PresetPlan || day4PresetPlan === '3E') : (day4AllocatedTotal <= 0 || day4AllocatedTotal > 100 || day4HasNegative || day4IsCreditBreached))
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-emerald-500 text-[#020617] hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer'
                }`}
              >
                <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <div className="flex flex-col text-left">
                  <span className="text-xs sm:text-sm tracking-wider sm:tracking-[0.2em] font-black">
                    {submitting 
                      ? 'EXECUTING...' 
                      : day4Mode === 'preset'
                      ? day4PresetPlan === '3E'
                        ? 'PLAN 3E REJECTED (OVER CAP)'
                        : day4PresetPlan
                        ? `AUTHORIZE PLAN [${day4PresetPlan}]`
                        : 'SELECT A PLAN'
                      : day4AllocatedTotal > 100
                      ? `EXCEEDS CAP (+${(day4AllocatedTotal - 100).toFixed(0)}M)`
                      : day4AllocatedTotal === 0
                      ? 'ALLOCATE FUNDS'
                      : `AUTHORIZE ALLOCATION (LKR ${day4AllocatedTotal.toFixed(0)}M)`}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono lowercase tracking-normal text-slate-800 font-bold truncate">
                    {day4Mode === 'preset'
                      ? day4PresetPlan ? `costs LKR ${day4PresetPlan === '3E' ? '120' : '100'}M against round cap` : 'select exactly one option from 3A–3E'
                      : `total spend: LKR ${day4AllocatedTotal.toFixed(0)}M / 100M`}
                  </span>
                </div>
                <Send size={18} className="shrink-0" />
              </motion.button>
            ) : state.bucket === 4 ? (
              <motion.button
                id="day6-authorize-btn"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.02, boxShadow: "0px 0px 40px rgba(16,185,129,0.5)" }}
                whileTap={{ scale: 0.96 }}
                disabled={submitting || (
                  day6Mode === 'preset'
                    ? !day6PresetPlan
                    : (day6HasLimitViolation || day6HasNegative || day6IsCreditBreached)
                )}
                onClick={handleSubmitDecision}
                className={`px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl font-black uppercase tracking-wider sm:tracking-[0.2em] flex items-center justify-center gap-3 transition-colors shadow-lg overflow-hidden relative group w-full sm:w-auto ${
                  (day6Mode === 'preset' ? !day6PresetPlan : (day6HasLimitViolation || day6HasNegative || day6IsCreditBreached))
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-emerald-500 text-[#020617] hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer'
                }`}
              >
                <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <div className="flex flex-col text-left">
                  <span className="text-xs sm:text-sm tracking-wider sm:tracking-[0.2em] font-black">
                    {submitting 
                      ? 'EXECUTING...' 
                      : day6Mode === 'preset'
                      ? day6PresetPlan === '4E'
                        ? 'HOLD FLEET IN RESERVE (LKR 0M)'
                        : day6PresetPlan
                        ? `AUTHORIZE FLEET PLAN [${day6PresetPlan}]`
                        : 'SELECT A FLEET PLAN'
                      : day6HasLimitViolation
                      ? 'RESOLVE FLEET LIMIT VIOLATIONS'
                      : day6TotalDeployed > 0
                      ? 'DEPLOY FLEET (FEE: LKR 60M)'
                      : 'HOLD IN RESERVE (COST: LKR 0M)'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono lowercase tracking-normal text-slate-800 font-bold truncate">
                    {day6Mode === 'preset'
                      ? day6PresetPlan ? `deployment fee: LKR ${day6PresetPlan === '4E' ? '0' : '60'}M` : 'select exactly one option from 4A–4E'
                      : `deployed: ${day6TotalDeployed} units | fee: LKR ${day6Cost}M`}
                  </span>
                </div>
                <Send size={18} className="shrink-0" />
              </motion.button>
            ) : (
              selectedOrder.length === 5 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02, boxShadow: "0px 0px 40px rgba(16,185,129,0.5)" }}
                  whileTap={{ scale: 0.96 }}
                  disabled={submitting}
                  onClick={handleSubmitDecision}
                  className="bg-emerald-500 text-[#020617] px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl font-black uppercase tracking-wider sm:tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)] overflow-hidden relative group w-full sm:w-auto cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs sm:text-sm tracking-wider sm:tracking-[0.2em] font-black">{submitting ? 'EXECUTING...' : 'AUTHORIZE DIRECTIVES'}</span>
                    <span className="text-[9px] sm:text-[10px] font-mono lowercase tracking-normal text-emerald-950 font-bold truncate">
                      {`executes top 3: ${selectedOrder.slice(0, 3).join(', ')}`}
                    </span>
                  </div>
                  <Send size={18} className="shrink-0" />
                </motion.button>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Cinematic Card Track: Shown when in Preset mode or in Operational rounds */}
        {(state.bucket !== 3 && state.bucket !== 4) || (state.bucket === 3 && day4Mode === 'preset') || (state.bucket === 4 && day6Mode === 'preset') ? (
          <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory relative touch-pan-x" style={{ scrollbarWidth: 'thin' }}>
            {currentScenario.actions.map((action: any) => {
              if (state.bucket === 3 && day4Mode === 'preset') {
                const isSelected = day4PresetPlan === action.id;
                return (
                  <ActionCard 
                    key={action.id} 
                    action={action} 
                    bucket={state.bucket}
                    isSelected={isSelected} 
                    isSingleSelect={true}
                    onClick={() => {
                      playUIBlip();
                      setDay4PresetPlan(prev => prev === action.id ? null : action.id);
                    }} 
                  />
                );
              }

              if (state.bucket === 4 && day6Mode === 'preset') {
                const isSelected = day6PresetPlan === action.id;
                return (
                  <ActionCard 
                    key={action.id} 
                    action={action} 
                    bucket={state.bucket}
                    isSelected={isSelected} 
                    isSingleSelect={true}
                    onClick={() => {
                      playUIBlip();
                      setDay6PresetPlan(prev => prev === action.id ? null : action.id);
                    }} 
                  />
                );
              }

              // Operational rounds
              const rankIndex = selectedOrder.indexOf(action.id);
              const isSelected = rankIndex !== -1;
              return (
                <ActionCard 
                  key={action.id} 
                  action={action} 
                  bucket={state.bucket}
                  isSelected={isSelected} 
                  rankIndex={rankIndex} 
                  isSingleSelect={false}
                  onClick={() => toggleSelection(action.id)} 
                />
              );
            })}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
