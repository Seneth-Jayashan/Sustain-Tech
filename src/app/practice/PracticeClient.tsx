'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Zap, 
  Radio, 
  AlertTriangle, 
  DollarSign, 
  Anchor, 
  Compass, 
  Layers, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  Info, 
  Award, 
  Trophy, 
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Coins,
  Send,
  Droplets,
  RadioTower,
  Navigation,
  LogOut,
  SlidersHorizontal,
  Home,
  Check,
  X
} from 'lucide-react';
import { 
  PRACTICE_DAY_1, 
  PRACTICE_DAY_2, 
  PRACTICE_DAY_3, 
  PracticeAction, 
  PracticePresetPlan,
  evaluatePracticeGame, 
  PracticeEvaluationResult 
} from './practiceData';

const LOCAL_STORAGE_KEY = 'sustain_tech_practice_session_v1';

interface SavedPracticeSession {
  currentDay: 1 | 2 | 3 | 4; // 4 = Completed / Results
  day1Rankings: string[];
  day2Mode: 'preset' | 'custom';
  day2PresetPlan: string | null;
  day2Allocations: {
    gridRestoration: number;
    cleanWater: number;
    emergencyTrauma: number;
  };
  day3Rankings: string[];
  savedAt: number;
}

export default function PracticeClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentDay, setCurrentDay] = useState<1 | 2 | 3 | 4>(1);
  const [showBrief, setShowBrief] = useState(true);
  
  // Day 1 State
  const [day1Rankings, setDay1Rankings] = useState<string[]>([]);
  
  // Day 2 State (Preset vs Custom like Real Game Day 4)
  const [day2Mode, setDay2Mode] = useState<'preset' | 'custom'>('preset');
  const [day2PresetPlan, setDay2PresetPlan] = useState<string | null>('2A');
  const [day2Allocations, setDay2Allocations] = useState<{
    gridRestoration: number;
    cleanWater: number;
    emergencyTrauma: number;
  }>({
    gridRestoration: 35,
    cleanWater: 35,
    emergencyTrauma: 30
  });

  // Day 3 State
  const [day3Rankings, setDay3Rankings] = useState<string[]>([]);

  // Results State
  const [results, setResults] = useState<PracticeEvaluationResult | null>(null);

  // Load from local storage
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed: SavedPracticeSession = JSON.parse(raw);
        if (parsed.currentDay) setCurrentDay(parsed.currentDay);
        if (Array.isArray(parsed.day1Rankings)) setDay1Rankings(parsed.day1Rankings);
        if (parsed.day2Mode) setDay2Mode(parsed.day2Mode);
        if (parsed.day2PresetPlan) setDay2PresetPlan(parsed.day2PresetPlan);
        if (parsed.day2Allocations) setDay2Allocations(parsed.day2Allocations);
        if (Array.isArray(parsed.day3Rankings)) setDay3Rankings(parsed.day3Rankings);

        if (parsed.currentDay === 4) {
          const evalResult = evaluatePracticeGame(
            parsed.day1Rankings || [],
            parsed.day2Allocations || { gridRestoration: 35, cleanWater: 35, emergencyTrauma: 30 },
            parsed.day3Rankings || []
          );
          setResults(evalResult);
        }
      }
    } catch (e) {
      console.warn('Failed to parse local practice session:', e);
    }
  }, []);

  // Save to local storage helper
  const persistSession = (
    day: 1 | 2 | 3 | 4,
    d1: string[],
    d2m: 'preset' | 'custom',
    d2p: string | null,
    d2a: { gridRestoration: number; cleanWater: number; emergencyTrauma: number },
    d3: string[]
  ) => {
    try {
      const sessionData: SavedPracticeSession = {
        currentDay: day,
        day1Rankings: d1,
        day2Mode: d2m,
        day2PresetPlan: d2p,
        day2Allocations: d2a,
        day3Rankings: d3,
        savedAt: Date.now()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const handleRestart = () => {
    if (confirm('Restart practice challenge? All local practice choices will be reset.')) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
      setDay1Rankings([]);
      setDay2Mode('preset');
      setDay2PresetPlan('2A');
      setDay2Allocations({ gridRestoration: 35, cleanWater: 35, emergencyTrauma: 30 });
      setDay3Rankings([]);
      setCurrentDay(1);
      setResults(null);
      setShowBrief(true);
    }
  };

  // Day 1 Ranking Toggle
  const handleToggleDay1Ranking = (id: string) => {
    setDay1Rankings(prev => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter(item => item !== id);
      } else {
        if (prev.length >= 3) {
          updated = [...prev.slice(1), id];
        } else {
          updated = [...prev, id];
        }
      }
      persistSession(1, updated, day2Mode, day2PresetPlan, day2Allocations, day3Rankings);
      return updated;
    });
  };

  // Day 2 Prebuilt Option Select
  const handleSelectDay2PresetPlan = (plan: PracticePresetPlan) => {
    setDay2PresetPlan(plan.id);
    setDay2Allocations(plan.allocations);
    persistSession(2, day1Rankings, 'preset', plan.id, plan.allocations, day3Rankings);
  };

  // Day 2 Custom Slider Change
  const handleDay2CustomSliderChange = (key: 'gridRestoration' | 'cleanWater' | 'emergencyTrauma', val: number) => {
    const clamped = Math.max(0, Math.min(50, isNaN(val) ? 0 : val));
    const nextAlloc = { ...day2Allocations, [key]: clamped };
    setDay2Allocations(nextAlloc);
    persistSession(2, day1Rankings, 'custom', null, nextAlloc, day3Rankings);
  };

  const applyDay2QuickPreset = (grid: number, water: number, trauma: number) => {
    const nextAlloc = { gridRestoration: grid, cleanWater: water, emergencyTrauma: trauma };
    setDay2Allocations(nextAlloc);
    persistSession(2, day1Rankings, 'custom', null, nextAlloc, day3Rankings);
  };

  // Day 3 Ranking Toggle
  const handleToggleDay3Ranking = (id: string) => {
    setDay3Rankings(prev => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter(item => item !== id);
      } else {
        if (prev.length >= 3) {
          updated = [...prev.slice(1), id];
        } else {
          updated = [...prev, id];
        }
      }
      persistSession(3, day1Rankings, day2Mode, day2PresetPlan, day2Allocations, updated);
      return updated;
    });
  };

  // Submit Day 1
  const submitDay1 = () => {
    if (day1Rankings.length !== 3) return;
    setCurrentDay(2);
    persistSession(2, day1Rankings, day2Mode, day2PresetPlan, day2Allocations, day3Rankings);
    setShowBrief(true);
  };

  // Submit Day 2
  const submitDay2 = () => {
    const total = day2Allocations.gridRestoration + day2Allocations.cleanWater + day2Allocations.emergencyTrauma;
    if (day2Mode === 'preset') {
      if (!day2PresetPlan || day2PresetPlan === '2E') return;
    } else {
      if (total <= 0 || total > 100) return;
    }
    setCurrentDay(3);
    persistSession(3, day1Rankings, day2Mode, day2PresetPlan, day2Allocations, day3Rankings);
    setShowBrief(true);
  };

  // Submit Day 3
  const submitDay3 = () => {
    if (day3Rankings.length !== 3) return;
    const evalResult = evaluatePracticeGame(day1Rankings, day2Allocations, day3Rankings);
    setResults(evalResult);
    setCurrentDay(4);
    persistSession(4, day1Rankings, day2Mode, day2PresetPlan, day2Allocations, day3Rankings);
  };

  const day2Total = day2Allocations.gridRestoration + day2Allocations.cleanWater + day2Allocations.emergencyTrauma;
  const day2Remaining = 100 - day2Total;

  // Active Scenario Info for floating brief
  const currentScenarioInfo = currentDay === 1 
    ? PRACTICE_DAY_1 
    : currentDay === 2 
    ? PRACTICE_DAY_2 
    : PRACTICE_DAY_3;

  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-[#050b14] flex items-center justify-center text-cyan-400 font-mono text-sm">
        Initializing Practice Simulation HUD...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen h-[100dvh] max-h-screen overflow-hidden flex flex-col justify-between bg-slate-950 text-slate-100 select-none font-sans">
      {/* ========================================================================= */}
      {/* MAP BACKGROUND LAYER (EXACT PARITY WITH REAL GAME)                        */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image 
          src="/assets/map_normal.jpg" 
          alt="Scenario Map" 
          fill 
          className="object-cover opacity-60 scale-105"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/80" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
        
        {/* Subtle Radar Sweep Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-cyan-500/10 rounded-full animate-ping pointer-events-none opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-cyan-500/15 rounded-full pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* TOP NAVIGATION HUD (EXACT PARITY WITH REAL GAME)                           */}
      {/* ========================================================================= */}
      <header className="relative z-20 w-full px-3 sm:px-6 py-2 bg-slate-950/90 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl flex items-center justify-between gap-3 shrink-0">
        {/* Left: Practice Branding & Round Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <Link
            href="/"
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:border-slate-500 text-slate-300 hover:text-white transition-all text-xs font-mono font-bold"
            title="Return to Landing Page"
          >
            <Home size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 border border-amber-500/50 text-amber-400 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Practice Mode
              </span>
              <span className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Day {currentDay === 4 ? '3' : currentDay} of 3</span>
                <span className="text-slate-500 hidden md:inline">• Operation Triton Surge</span>
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px] sm:max-w-none">
              {currentScenarioInfo.scenarioSubtitle}
            </span>
          </div>
        </div>

        {/* Center: Stepper Buttons */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs font-mono">
          <button
            onClick={() => { setCurrentDay(1); setShowBrief(true); }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              currentDay === 1
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                : day1Rankings.length === 3
                ? 'text-cyan-400 hover:text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Day 1</span>
            {day1Rankings.length === 3 && <Check size={12} className={currentDay === 1 ? 'text-black' : 'text-emerald-400'} />}
          </button>

          <button
            onClick={() => {
              if (day1Rankings.length === 3) { setCurrentDay(2); setShowBrief(true); }
            }}
            disabled={day1Rankings.length !== 3}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              currentDay === 2
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                : day2Total > 0 && day2Total <= 100
                ? 'text-cyan-400 hover:text-white'
                : 'text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <span>Day 2</span>
            <span className="text-[10px] opacity-80">(100M Cap)</span>
            {day2Total > 0 && day2Total <= 100 && day1Rankings.length === 3 && (
              <Check size={12} className={currentDay === 2 ? 'text-black' : 'text-emerald-400'} />
            )}
          </button>

          <button
            onClick={() => {
              if (day1Rankings.length === 3 && day2Total > 0 && day2Total <= 100) { setCurrentDay(3); setShowBrief(true); }
            }}
            disabled={day1Rankings.length !== 3 || day2Total <= 0 || day2Total > 100}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              currentDay === 3
                ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                : day3Rankings.length === 3
                ? 'text-cyan-400 hover:text-white'
                : 'text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <span>Day 3</span>
            {day3Rankings.length === 3 && <Check size={12} className={currentDay === 3 ? 'text-black' : 'text-emerald-400'} />}
          </button>

          <button
            onClick={() => {
              if (results) setCurrentDay(4);
            }}
            disabled={!results}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              currentDay === 4
                ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                : results
                ? 'text-emerald-400 hover:text-white'
                : 'text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <Trophy size={13} />
            <span>Results</span>
          </button>
        </div>

        {/* Right: Metrics & Controls (Parity with Real Game) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Metrics Bar (Desktop) */}
          <div className="hidden xl:flex items-center gap-1.5">
            <div className="flex items-center justify-between w-28 px-2 py-1 rounded-xl bg-slate-900/80 border border-blue-500/30 text-blue-400 font-mono text-xs">
              <span className="text-[9px] uppercase font-bold">SURGE</span>
              <span className="font-bold">52%</span>
            </div>
            <div className="flex items-center justify-between w-28 px-2 py-1 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-400 font-mono text-xs">
              <span className="text-[9px] uppercase font-bold">GRID</span>
              <span className="font-bold">48%</span>
            </div>
            <div className="flex items-center justify-between w-28 px-2 py-1 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-400 font-mono text-xs">
              <span className="text-[9px] uppercase font-bold">INTEL</span>
              <span className="font-bold">60%</span>
            </div>
            <div className="flex items-center justify-between w-28 px-2 py-1 rounded-xl bg-slate-900/80 border border-purple-500/30 text-purple-400 font-mono text-xs">
              <span className="text-[9px] uppercase font-bold">TRUST</span>
              <span className="font-bold">65%</span>
            </div>
          </div>

          {/* Budget Display Pill */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-lg">
            <Coins size={16} className="text-emerald-400" />
            <div className="flex flex-col text-right leading-none">
              <span className="text-[8px] font-mono font-bold uppercase text-emerald-400">
                {currentDay === 2 ? 'Day 2 Grant' : 'Practice Budget'}
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-emerald-300">
                {currentDay === 2 ? 'LKR 100M Cap' : 'LKR 500M'}
              </span>
            </div>
          </div>

          {/* Scenario Briefing Toggle Button */}
          <button
            onClick={() => setShowBrief(!showBrief)}
            className={`flex items-center gap-1.5 h-8 sm:h-9 px-2.5 rounded-xl border backdrop-blur-xl font-mono text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
              showBrief 
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-white'
            }`}
            title={showBrief ? 'Minimize briefing dialog' : 'Open scenario briefing dialog'}
          >
            <div className="relative w-4 h-4 rounded-full overflow-hidden border border-cyan-400 shrink-0">
              <Image src="/assets/portrait_advisor.jpg" alt="Advisor" fill className="object-cover" unoptimized />
            </div>
            <span className="hidden sm:inline">{showBrief ? 'Hide Brief' : 'Briefing'}</span>
          </button>

          {/* Restart Session Button */}
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 h-8 sm:h-9 px-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-rose-950/40 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-colors text-xs font-mono font-bold cursor-pointer"
            title="Restart Practice Drill (Clears Local Storage)"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Real Game Tournament Link */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-colors shadow-md shadow-emerald-500/20"
            title="Go to Official Tournament Login"
          >
            <span className="hidden sm:inline">Tournament</span>
            <LogOut size={13} />
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* FLOATING ADVISOR BRIEFING OVERLAY (EXACT PARITY WITH REAL GAME)           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showBrief && currentDay !== 4 && (
          <div className="absolute top-14 left-3 sm:left-6 md:left-8 z-30 w-[94vw] max-w-lg xl:max-w-xl pointer-events-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", damping: 24, stiffness: 200 }}
              className="relative flex flex-col gap-1.5"
            >
              {/* Advisor Avatar Pop-in with Collapse Action */}
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-end gap-2.5">
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] bg-black z-20 shrink-0">
                    <Image src="/assets/portrait_advisor.jpg" alt="Advisor" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay" />
                  </div>
                  <div className="bg-cyan-950/90 border border-cyan-500/50 px-3 py-1 rounded-t-xl rounded-br-xl backdrop-blur-md shadow-lg">
                    <span className="text-cyan-400 font-black tracking-wider text-[10px] sm:text-xs uppercase flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Priority Scenario Briefing • Day {currentDay}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowBrief(false)} 
                  className="mb-0.5 text-xs font-mono font-bold text-cyan-300 hover:text-white bg-slate-900/95 border border-cyan-500/40 px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Minimize briefing to focus on allocation decisions"
                >
                  <ChevronUp size={14} />
                  <span>Minimize</span>
                </button>
              </div>

              {/* Message Box */}
              <div className="relative bg-slate-950/95 backdrop-blur-2xl border border-slate-700/90 rounded-2xl p-3.5 sm:p-4 shadow-2xl overflow-hidden sm:ml-4 z-10 max-h-[38vh] flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
                
                <div className="flex justify-between items-start mb-1.5 gap-2 shrink-0">
                  <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                    {currentScenarioInfo.title}
                  </h2>
                  <button 
                    onClick={() => setShowBrief(false)} 
                    className="text-slate-400 hover:text-white transition-colors bg-slate-800/80 p-1 rounded-full hover:bg-red-500/20 hover:text-red-400 shrink-0 cursor-pointer" 
                    title="Minimize briefing"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Situation Text */}
                <div className="overflow-y-auto pr-1 text-xs sm:text-[13px] text-slate-300 font-sans leading-relaxed whitespace-pre-line space-y-2">
                  <p>{currentScenarioInfo.situation}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CENTER EMPTY VIEWPORT AREA (PRESERVES MAP VISIBILITY & NO SCROLL)          */}
      {/* ========================================================================= */}
      <div className="flex-1 pointer-events-none" />

      {/* ========================================================================= */}
      {/* BOTTOM ACTION DECK (EXACT PARITY WITH REAL GAME DASHBOARD)                */}
      {/* ========================================================================= */}
      {currentDay !== 4 && (
        <section className="relative z-20 w-full px-2 sm:px-4 pb-2 sm:pb-3 max-h-[50vh] flex flex-col justify-end shrink-0 pointer-events-auto">
          {/* Deck Header Bar */}
          <div className="flex items-center justify-between gap-2 mb-1.5 bg-slate-950/90 backdrop-blur-xl border border-slate-800/80 px-3 py-1.5 rounded-xl shadow-lg">
            {/* Title & Mode Switcher */}
            <div className="flex items-center gap-3">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span>
                  {currentDay === 2 
                    ? (day2Mode === 'preset' ? 'Day 2 — Select One Prebuilt Plan' : 'Day 2 — Custom Sector Allocation')
                    : 'Priority Directives'}
                </span>
                {currentDay !== 2 && (
                  <span className="text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
                    {currentDay === 1 ? day1Rankings.length : day3Rankings.length}/3 Selected
                  </span>
                )}
              </h3>

              {/* Day 2 Mode Switcher (Preset vs Custom like Real Game Day 4) */}
              {currentDay === 2 && (
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setDay2Mode('preset')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                      day2Mode === 'preset'
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers size={12} />
                    <span>Preset Plans</span>
                  </button>
                  <button
                    onClick={() => setDay2Mode('custom')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                      day2Mode === 'custom'
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders size={12} />
                    <span>Custom Allocation</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Status Pill & Authorize Action Button */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/80 font-mono text-[10px] text-slate-400">
                <Clock size={12} className="text-cyan-400" />
                <span>UNTIMED PRACTICE</span>
              </div>

              {/* Authorize Action Button */}
              {currentDay === 1 && (
                <button
                  onClick={submitDay1}
                  disabled={day1Rankings.length !== 3}
                  className={`px-4 py-2 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                    day1Rankings.length === 3
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>{day1Rankings.length === 3 ? 'Authorize Directives' : `Select ${3 - day1Rankings.length} More`}</span>
                  <Send size={13} />
                </button>
              )}

              {currentDay === 2 && (
                <button
                  onClick={submitDay2}
                  disabled={
                    day2Mode === 'preset' 
                      ? (!day2PresetPlan || day2PresetPlan === '2E')
                      : (day2Total <= 0 || day2Total > 100)
                  }
                  className={`px-4 py-2 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                    (day2Mode === 'preset' ? (day2PresetPlan && day2PresetPlan !== '2E') : (day2Total > 0 && day2Total <= 100))
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>
                    {day2Mode === 'preset'
                      ? day2PresetPlan === '2E'
                        ? 'PLAN 2E REJECTED (OVER CAP)'
                        : day2PresetPlan
                        ? `AUTHORIZE PLAN [${day2PresetPlan}]`
                        : 'SELECT A PLAN'
                      : day2Total > 100
                      ? `EXCEEDS 100M (+${day2Total - 100}M)`
                      : day2Total === 0
                      ? 'ALLOCATE FUNDS'
                      : `AUTHORIZE ALLOCATION (LKR ${day2Total}M)`}
                  </span>
                  <Send size={13} />
                </button>
              )}

              {currentDay === 3 && (
                <button
                  onClick={submitDay3}
                  disabled={day3Rankings.length !== 3}
                  className={`px-4 py-2 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                    day3Rankings.length === 3
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trophy size={13} />
                  <span>{day3Rankings.length === 3 ? 'Generate Demo Results' : `Select ${3 - day3Rankings.length} More`}</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DAY 1 CARDS ROW                                                           */}
          {/* ========================================================================= */}
          {currentDay === 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 max-h-[35vh]">
              {PRACTICE_DAY_1.actions.map(action => {
                const rankIndex = day1Rankings.indexOf(action.id);
                const isSelected = rankIndex !== -1;

                return (
                  <motion.div
                    key={action.id}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleToggleDay1Ranking(action.id)}
                    className={`w-64 sm:w-72 lg:w-80 shrink-0 rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all border flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                          {action.category}
                        </span>
                        {isSelected ? (
                          <span className="bg-cyan-500 text-black font-black text-[10px] font-mono px-2 py-0.5 rounded-full">
                            RANK #{rankIndex + 1}
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 text-xs font-mono">
                            +
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug mb-1">
                        {action.title}
                      </h4>
                      <p className="text-[11px] text-cyan-200/90 font-medium italic mb-1.5">
                        "{action.tagline}"
                      </p>
                      <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed mb-2">
                        {action.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono space-y-0.5">
                      <div className="text-emerald-400 truncate">
                        <span className="font-bold">PRO:</span> {action.pros}
                      </div>
                      <div className="text-amber-400 truncate">
                        <span className="font-bold">CON:</span> {action.cons}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* DAY 2 CARDS ROW (PRESET PLANS OR CUSTOM SLIDERS)                          */}
          {/* ========================================================================= */}
          {currentDay === 2 && day2Mode === 'preset' && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 max-h-[35vh]">
              {PRACTICE_DAY_2.presetPlans.map(plan => {
                const isSelected = day2PresetPlan === plan.id;
                const isOver = plan.isOverLimit;

                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleSelectDay2PresetPlan(plan)}
                    className={`w-64 sm:w-72 lg:w-80 shrink-0 rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all border flex flex-col justify-between select-none ${
                      isOver
                        ? isSelected
                          ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                          : 'bg-slate-950/80 border-rose-900/60 hover:border-rose-700'
                        : isSelected
                        ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isOver ? 'text-rose-400' : 'text-cyan-400'
                        }`}>
                          {plan.id} • {plan.totalCost}M LKR
                        </span>
                        {isSelected ? (
                          <span className={`text-black font-black text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isOver ? 'bg-rose-500 text-white' : 'bg-cyan-500'
                          }`}>
                            {isOver ? 'REJECTED' : 'SELECTED'}
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 text-xs font-mono">
                            +
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug mb-1">
                        {plan.title}
                      </h4>
                      <p className="text-[11px] text-cyan-200/90 font-mono font-semibold mb-1.5">
                        {plan.tagline}
                      </p>
                      <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed mb-2">
                        {plan.description}
                      </p>
                    </div>

                    {/* Sector Mini-Pills */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-center mb-1">
                        <div className="bg-slate-900 p-1 rounded border border-slate-800">
                          <span className="text-amber-400 font-bold block">{plan.allocations.gridRestoration}M</span>
                          <span className="text-[9px] text-slate-500">Grid</span>
                        </div>
                        <div className="bg-slate-900 p-1 rounded border border-slate-800">
                          <span className="text-cyan-400 font-bold block">{plan.allocations.cleanWater}M</span>
                          <span className="text-[9px] text-slate-500">Water</span>
                        </div>
                        <div className="bg-slate-900 p-1 rounded border border-slate-800">
                          <span className="text-rose-400 font-bold block">{plan.allocations.emergencyTrauma}M</span>
                          <span className="text-[9px] text-slate-500">Trauma</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* DAY 2 CUSTOM SLIDERS TRAY                                                 */}
          {/* ========================================================================= */}
          {currentDay === 2 && day2Mode === 'custom' && (
            <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl max-h-[35vh] overflow-y-auto">
              {/* Financial Accounting Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pb-3 mb-3 border-b border-slate-800 text-xs font-mono">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">AUTHORIZED GRANT</span>
                  <span className="font-bold text-white text-sm">LKR 100.0M</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">ALLOCATED SPEND</span>
                  <span className={`font-bold text-sm ${day2Total > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    LKR {day2Total}.0M
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">UNALLOCATED BALANCE</span>
                  <span className={`font-bold text-sm ${day2Remaining < 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    LKR {day2Remaining}.0M
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">STATUS</span>
                    <span className={`font-bold text-xs ${day2Total > 100 ? 'text-rose-400' : day2Total === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {day2Total > 100 ? 'OVER CAP' : day2Total === 100 ? 'BALANCED' : 'UNDER BUDGET'}
                    </span>
                  </div>
                  {/* Presets */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => applyDay2QuickPreset(35, 35, 30)}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-[9px] font-mono"
                    >
                      35/35/30
                    </button>
                    <button
                      onClick={() => applyDay2QuickPreset(50, 25, 25)}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-400 text-amber-300 text-[9px] font-mono"
                    >
                      50/25/25
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Slider Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PRACTICE_DAY_2.sectors.map(sector => {
                  const currentValue = day2Allocations[sector.key];

                  return (
                    <div key={sector.key} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs">{sector.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">Max: {sector.maxLimit}M</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mb-2">
                          {sector.impactSummary}
                        </p>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-cyan-400">Assigned:</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-xs text-white">
                            <input
                              type="number"
                              min={0}
                              max={sector.maxLimit}
                              value={currentValue}
                              onChange={(e) => handleDay2CustomSliderChange(sector.key, parseInt(e.target.value) || 0)}
                              className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-white text-xs"
                            />
                            <span>M LKR</span>
                          </div>
                        </div>

                        <input
                          type="range"
                          min={0}
                          max={sector.maxLimit}
                          step={1}
                          value={currentValue}
                          onChange={(e) => handleDay2CustomSliderChange(sector.key, parseInt(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DAY 3 CARDS ROW                                                           */}
          {/* ========================================================================= */}
          {currentDay === 3 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 max-h-[35vh]">
              {PRACTICE_DAY_3.actions.map(action => {
                const rankIndex = day3Rankings.indexOf(action.id);
                const isSelected = rankIndex !== -1;

                return (
                  <motion.div
                    key={action.id}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleToggleDay3Ranking(action.id)}
                    className={`w-64 sm:w-72 lg:w-80 shrink-0 rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all border flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-slate-900/95 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                          {action.category}
                        </span>
                        {isSelected ? (
                          <span className="bg-emerald-500 text-black font-black text-[10px] font-mono px-2 py-0.5 rounded-full">
                            RANK #{rankIndex + 1}
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 text-xs font-mono">
                            +
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug mb-1">
                        {action.title}
                      </h4>
                      <p className="text-[11px] text-emerald-200/90 font-medium italic mb-1.5">
                        "{action.tagline}"
                      </p>
                      <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed mb-2">
                        {action.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono space-y-0.5">
                      <div className="text-emerald-400 truncate">
                        <span className="font-bold">PRO:</span> {action.pros}
                      </div>
                      <div className="text-amber-400 truncate">
                        <span className="font-bold">CON:</span> {action.cons}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* RESULTS MODAL (PARITY WITH REFLECTION DEBRIEF & FITS IN 1 WINDOW)         */}
      {/* ========================================================================= */}
      {currentDay === 4 && results && (
        <div className="relative z-30 flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(6,182,212,0.2)] backdrop-blur-3xl flex flex-col justify-between max-h-[92vh] overflow-y-auto"
          >
            {/* Top Bar with Score Ring & Tier */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-5">
                {/* Glowing Score Ring */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center bg-slate-900 border-4 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.4)] shrink-0 font-mono">
                  <span className="text-2xl sm:text-3xl font-black text-white">{results.score}</span>
                  <span className="text-[9px] uppercase tracking-widest text-cyan-300">/ 100 PTS</span>
                </div>

                <div>
                  <div className="inline-block px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase mb-1.5 border backdrop-blur-md">
                    <span className={results.tierColor.split(' ')[0]}>{results.tier}</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                    Practice Simulation Debrief
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                    {results.summary}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleRestart}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <RotateCcw size={14} className="text-cyan-400" />
                  <span>Retake Drill</span>
                </button>
                <Link
                  href="/login"
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <span>Enter Real Game</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 3 Pillar Score Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              {results.pillars.map((pillar, i) => (
                <div key={i} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{pillar.name}</span>
                    <span className="text-xs font-black font-mono text-cyan-400">{pillar.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div 
                      style={{ width: `${pillar.score}%` }} 
                      className={`h-full rounded-full ${
                        pillar.score >= 80 ? 'bg-emerald-400' : pillar.score >= 60 ? 'bg-cyan-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Day 1, 2, 3 Audit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">Day 1 Tactical Audit</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">{results.day1Breakdown.feedback}</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">Day 2 Budget Audit</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">{results.day2Breakdown.feedback}</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">Day 3 Recovery Audit</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">{results.day3Breakdown.feedback}</p>
              </div>
            </div>

            {/* Disclaimer & Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
              <span>All results evaluated locally in browser storage (zero network database calls).</span>
              <button onClick={() => setCurrentDay(1)} className="hover:text-cyan-400 underline">
                Review My Day 1 Choices
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
