'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Info,
  Trophy,
  Sparkles,
  ChevronUp,
  Clock,
  Send,
  Home,
  Check,
  X,
  LogOut,
  Bus,
  Train,
  CreditCard,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Sliders,
  DollarSign,
  ChevronDown
} from 'lucide-react';
import {
  PRACTICE_SCENARIOS,
  PRACTICE_SCENARIO_1,
  PRACTICE_SCENARIO_2,
  PRACTICE_SCENARIO_3,
  PracticeOption,
  PracticePresetPlan,
  evaluatePracticeGame,
  PracticeEvaluationResult
} from './practiceData';

const LOCAL_STORAGE_KEY = 'sustain_tech_practice_session_v1';

interface SavedPracticeSession {
  currentScenario: 1 | 2 | 3 | 4; // 4 = Completed / Results
  scenario1Rankings: string[]; // array of option IDs in order of priority (e.g. ['B', 'E', 'A', 'D', 'C'])
  scenario2Mode: 'preset' | 'custom';
  scenario2PresetPlan: string | null;
  scenario2Allocations: {
    relocationStalls: number;
    phasedConstruction: number;
    livelihoodSupport: number;
  };
  scenario3Rankings: string[]; // array of option IDs in order of priority (e.g. ['C', 'E', 'B', 'A', 'D'])
  savedAt: number;
}

export default function PracticeClient() {
  const [mounted, setMounted] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<1 | 2 | 3 | 4>(1);
  const [showBrief, setShowBrief] = useState(true);

  // Scenario 1: Ranking of 5 options
  const [scenario1Rankings, setScenario1Rankings] = useState<string[]>([]);

  // Scenario 2: Resource Allocation (Presets vs Custom)
  const [scenario2Mode, setScenario2Mode] = useState<'preset' | 'custom'>('preset');
  const [scenario2PresetPlan, setScenario2PresetPlan] = useState<string | null>('2A');
  const [scenario2Allocations, setScenario2Allocations] = useState<{
    relocationStalls: number;
    phasedConstruction: number;
    livelihoodSupport: number;
  }>({
    relocationStalls: 40,
    phasedConstruction: 35,
    livelihoodSupport: 25
  });

  // Scenario 3: Ranking of 5 options
  const [scenario3Rankings, setScenario3Rankings] = useState<string[]>([]);

  // Results State
  const [results, setResults] = useState<PracticeEvaluationResult | null>(null);

  // Load from local storage
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed: SavedPracticeSession = JSON.parse(raw);
        if (parsed.currentScenario) setCurrentScenario(parsed.currentScenario);
        if (Array.isArray(parsed.scenario1Rankings)) setScenario1Rankings(parsed.scenario1Rankings);
        if (parsed.scenario2Mode) setScenario2Mode(parsed.scenario2Mode);
        if (parsed.scenario2PresetPlan) setScenario2PresetPlan(parsed.scenario2PresetPlan);
        if (parsed.scenario2Allocations) setScenario2Allocations(parsed.scenario2Allocations);
        if (Array.isArray(parsed.scenario3Rankings)) setScenario3Rankings(parsed.scenario3Rankings);

        if (parsed.currentScenario === 4) {
          const evalResult = evaluatePracticeGame(
            parsed.scenario1Rankings || [],
            {
              mode: parsed.scenario2Mode || 'preset',
              presetPlan: parsed.scenario2PresetPlan || '2A',
              allocations: parsed.scenario2Allocations || { relocationStalls: 40, phasedConstruction: 35, livelihoodSupport: 25 }
            },
            parsed.scenario3Rankings || []
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
    scenario: 1 | 2 | 3 | 4,
    s1R: string[],
    s2M: 'preset' | 'custom',
    s2P: string | null,
    s2A: { relocationStalls: number; phasedConstruction: number; livelihoodSupport: number },
    s3R: string[]
  ) => {
    try {
      const sessionData: SavedPracticeSession = {
        currentScenario: scenario,
        scenario1Rankings: s1R,
        scenario2Mode: s2M,
        scenario2PresetPlan: s2P,
        scenario2Allocations: s2A,
        scenario3Rankings: s3R,
        savedAt: Date.now()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const handleRestart = () => {
    if (confirm('Restart practice challenge? All local decisions will be reset.')) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
      setScenario1Rankings([]);
      setScenario2Mode('preset');
      setScenario2PresetPlan('2A');
      setScenario2Allocations({ relocationStalls: 40, phasedConstruction: 35, livelihoodSupport: 25 });
      setScenario3Rankings([]);
      setCurrentScenario(1);
      setResults(null);
      setShowBrief(true);
    }
  };

  // Ranking toggle helper for Scenario 1
  const handleToggleScenario1Ranking = (id: string) => {
    setScenario1Rankings(prev => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter(item => item !== id);
      } else {
        updated = [...prev, id];
      }
      persistSession(1, updated, scenario2Mode, scenario2PresetPlan, scenario2Allocations, scenario3Rankings);
      return updated;
    });
  };

  // Ranking toggle helper for Scenario 3
  const handleToggleScenario3Ranking = (id: string) => {
    setScenario3Rankings(prev => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter(item => item !== id);
      } else {
        updated = [...prev, id];
      }
      persistSession(3, scenario1Rankings, scenario2Mode, scenario2PresetPlan, scenario2Allocations, updated);
      return updated;
    });
  };

  // Scenario 2 Presets & Sliders
  const handleSelectScenario2PresetPlan = (plan: PracticePresetPlan) => {
    setScenario2PresetPlan(plan.id);
    setScenario2Allocations(plan.allocations);
    persistSession(2, scenario1Rankings, 'preset', plan.id, plan.allocations, scenario3Rankings);
  };

  const handleScenario2CustomSliderChange = (
    key: 'relocationStalls' | 'phasedConstruction' | 'livelihoodSupport',
    val: number
  ) => {
    const clamped = Math.max(0, Math.min(50, isNaN(val) ? 0 : val));
    const nextAlloc = { ...scenario2Allocations, [key]: clamped };
    setScenario2Allocations(nextAlloc);
    persistSession(2, scenario1Rankings, 'custom', null, nextAlloc, scenario3Rankings);
  };

  const applyScenario2QuickPreset = (stalls: number, phasing: number, support: number) => {
    const nextAlloc = { relocationStalls: stalls, phasedConstruction: phasing, livelihoodSupport: support };
    setScenario2Allocations(nextAlloc);
    persistSession(2, scenario1Rankings, 'custom', null, nextAlloc, scenario3Rankings);
  };

  // Submissions
  const submitScenario1 = () => {
    if (scenario1Rankings.length < 3) return;
    setCurrentScenario(2);
    persistSession(2, scenario1Rankings, scenario2Mode, scenario2PresetPlan, scenario2Allocations, scenario3Rankings);
    setShowBrief(true);
  };

  const scenario2Total = scenario2Allocations.relocationStalls + scenario2Allocations.phasedConstruction + scenario2Allocations.livelihoodSupport;
  const scenario2Remaining = 100 - scenario2Total;

  const submitScenario2 = () => {
    if (scenario2Mode === 'preset') {
      if (!scenario2PresetPlan || scenario2PresetPlan === '2E') return;
    } else {
      if (scenario2Total <= 0 || scenario2Total > 100) return;
    }
    setCurrentScenario(3);
    persistSession(3, scenario1Rankings, scenario2Mode, scenario2PresetPlan, scenario2Allocations, scenario3Rankings);
    setShowBrief(true);
  };

  const submitScenario3 = () => {
    if (scenario3Rankings.length < 3) return;
    const evalResult = evaluatePracticeGame(
      scenario1Rankings,
      { mode: scenario2Mode, presetPlan: scenario2PresetPlan, allocations: scenario2Allocations },
      scenario3Rankings
    );
    setResults(evalResult);
    setCurrentScenario(4);
    persistSession(4, scenario1Rankings, scenario2Mode, scenario2PresetPlan, scenario2Allocations, scenario3Rankings);
  };

  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-[#050b14] flex items-center justify-center text-cyan-400 font-mono text-sm">
        Initializing Practice Simulation HUD...
      </div>
    );
  }

  // Active Scenario Info
  const activeScenarioTitle = currentScenario === 1
    ? PRACTICE_SCENARIO_1.title
    : currentScenario === 2
      ? PRACTICE_SCENARIO_2.title
      : PRACTICE_SCENARIO_3.title;

  const activeScenarioSubtitle = currentScenario === 1
    ? PRACTICE_SCENARIO_1.scenarioSubtitle
    : currentScenario === 2
      ? PRACTICE_SCENARIO_2.scenarioSubtitle
      : PRACTICE_SCENARIO_3.scenarioSubtitle;

  const activeScenarioSituation = currentScenario === 1
    ? PRACTICE_SCENARIO_1.situation
    : currentScenario === 2
      ? PRACTICE_SCENARIO_2.situation
      : PRACTICE_SCENARIO_3.situation;

  return (
    <div className="relative w-screen h-screen h-[100dvh] max-h-screen overflow-hidden flex flex-col justify-between bg-slate-950 text-slate-100 select-none font-sans">
      {/* ========================================================================= */}
      {/* MAP BACKGROUND LAYER                                                      */}
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/90" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-cyan-500/10 rounded-full animate-ping pointer-events-none opacity-20" />
      </div>

      {/* ========================================================================= */}
      {/* TOP NAVIGATION HUD (CLEAN, PROPER SPACING, HIGH VISIBILITY)                */}
      {/* ========================================================================= */}
      <header className="relative z-20 w-full px-3 sm:px-6 py-2.5 bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800 shadow-2xl flex items-center justify-between gap-3 shrink-0">
        {/* Left Section: Home Link, Emblem & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-700 bg-slate-900/90 hover:border-slate-500 text-slate-300 hover:text-white transition-all text-xs font-mono font-bold"
            title="Return to Landing Page"
          >
            <Home size={15} className="text-cyan-400" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {/* Banner */}
          <div className="hidden lg:flex items-center bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
            <div className="relative h-6 w-24 overflow-hidden rounded-md bg-white/95 px-1">
              <Image src="/assets/images/Banner.jpg" alt="Symposium" fill className="object-contain" unoptimized />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 border border-amber-500/50 text-amber-400 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Practice Sandbox
              </span>
              <span className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Scenario {currentScenario === 4 ? '3' : currentScenario} of 3</span>
                <span className="text-slate-500 hidden md:inline">• Urban Mobility & Policy Challenge</span>
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300/80 truncate max-w-[220px] sm:max-w-md">
              {activeScenarioSubtitle}
            </span>
          </div>
        </div>

        {/* Center: Stepper Buttons (Prominent & Clear) */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/95 border border-slate-800 p-1 rounded-xl text-xs font-mono shrink-0">
          <button
            onClick={() => { setCurrentScenario(1); setShowBrief(true); }}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${currentScenario === 1
              ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
              : scenario1Rankings.length >= 3
                ? 'text-cyan-400 hover:text-white'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <span>Scenario 1</span>
            {scenario1Rankings.length >= 3 && <Check size={12} className={currentScenario === 1 ? 'text-black' : 'text-emerald-400'} />}
          </button>

          <button
            onClick={() => {
              if (scenario1Rankings.length >= 3) { setCurrentScenario(2); setShowBrief(true); }
            }}
            disabled={scenario1Rankings.length < 3}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${currentScenario === 2
              ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
              : scenario2Total > 0 && scenario2Total <= 100
                ? 'text-cyan-400 hover:text-white cursor-pointer'
                : 'text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
          >
            <span>Scenario 2</span>
            {scenario2Total > 0 && scenario2Total <= 100 && (
              <Check size={12} className={currentScenario === 2 ? 'text-black' : 'text-emerald-400'} />
            )}
          </button>

          <button
            onClick={() => {
              if (scenario1Rankings.length >= 3 && scenario2Total > 0 && scenario2Total <= 100) {
                setCurrentScenario(3);
                setShowBrief(true);
              }
            }}
            disabled={scenario1Rankings.length < 3 || scenario2Total <= 0 || scenario2Total > 100}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${currentScenario === 3
              ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
              : scenario3Rankings.length >= 3
                ? 'text-cyan-400 hover:text-white cursor-pointer'
                : 'text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
          >
            <span>Scenario 3</span>
            {scenario3Rankings.length >= 3 && <Check size={12} className={currentScenario === 3 ? 'text-black' : 'text-emerald-400'} />}
          </button>

          <button
            onClick={() => {
              if (results) setCurrentScenario(4);
            }}
            disabled={!results}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${currentScenario === 4
              ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
              : results
                ? 'text-emerald-400 hover:text-white cursor-pointer'
                : 'text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
          >
            <Trophy size={13} />
            <span>Evaluation</span>
          </button>
        </div>

        {/* Right Section: Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Briefing Toggle Button */}
          <button
            onClick={() => setShowBrief(!showBrief)}
            className={`flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl border backdrop-blur-xl font-mono text-xs font-bold transition-all cursor-pointer ${showBrief
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-white'
              }`}
            title={showBrief ? 'Minimize briefing dialog' : 'Open scenario briefing dialog'}
          >
            <div className="relative w-4 h-4 rounded-full overflow-hidden border border-cyan-400 shrink-0">
              <Image src="/assets/portrait_advisor.jpg" alt="Advisor" fill className="object-cover" unoptimized />
            </div>
            <span className="hidden md:inline">{showBrief ? 'Hide Brief' : 'Briefing'}</span>
          </button>

          {/* Reset Drill Button */}
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 h-9 px-2.5 sm:px-3 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-rose-950/40 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-colors text-xs font-mono font-bold cursor-pointer"
            title="Restart Practice Drill (Clears Local Storage)"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Tournament Link */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-colors shadow-md shadow-emerald-500/20"
            title="Go to Live Tournament Login"
          >
            <span className="hidden sm:inline">Tournament</span>
            <LogOut size={13} />
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* FLOATING ADVISOR BRIEFING OVERLAY                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showBrief && currentScenario !== 4 && (
          <div className="absolute top-16 left-3 sm:left-6 md:left-8 z-30 w-[94vw] max-w-xl xl:max-w-2xl pointer-events-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", damping: 24, stiffness: 200 }}
              className="relative flex flex-col gap-1.5"
            >
              {/* Advisor Header Banner */}
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-end gap-2.5">
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] bg-black z-20 shrink-0">
                    <Image src="/assets/portrait_advisor.jpg" alt="Advisor" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay" />
                  </div>
                  <div className="bg-cyan-950/90 border border-cyan-500/50 px-3 py-1 rounded-t-xl rounded-br-xl backdrop-blur-md shadow-lg flex items-center gap-2">
                    <span className="text-cyan-400 font-black tracking-wider text-[10px] sm:text-xs uppercase font-mono">
                      Planning Briefing • Scenario {currentScenario}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowBrief(false)}
                  className="mb-0.5 text-xs font-mono font-bold text-cyan-300 hover:text-white bg-slate-900/95 border border-cyan-500/40 px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1 hover:bg-slate-800 transition-all cursor-pointer"
                  title="Minimize briefing to inspect decision options"
                >
                  <ChevronUp size={14} />
                  <span>Minimize</span>
                </button>
              </div>

              {/* Message Box */}
              <div className="relative bg-slate-950/95 backdrop-blur-2xl border border-slate-700/90 rounded-2xl p-4 sm:p-5 shadow-2xl overflow-hidden sm:ml-4 z-10 max-h-[36vh] flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="flex justify-between items-start mb-2 gap-2 shrink-0">
                  <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                    {activeScenarioTitle}
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
                <div className="overflow-y-auto pr-1 text-xs sm:text-[13px] text-slate-200 font-sans leading-relaxed space-y-2">
                  <p className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl text-slate-100 font-medium whitespace-pre-line">
                    {activeScenarioSituation}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spacer to preserve map view when deck is visible */}
      {currentScenario !== 4 && <div className="flex-1 pointer-events-none" />}

      {/* ========================================================================= */}
      {/* SCENARIO 1 & SCENARIO 3: RANKING DECK (5 OPTIONS, PRIORITIZE 1 - 5)       */}
      {/* ========================================================================= */}
      {(currentScenario === 1 || currentScenario === 3) && (
        <section className="relative z-20 w-full px-2 sm:px-4 pb-2 sm:pb-3 max-h-[56vh] flex flex-col justify-end shrink-0 pointer-events-auto">
          {/* Deck Header Bar */}
          <div className="flex items-center justify-between gap-2 mb-2 bg-slate-950/95 backdrop-blur-xl border border-slate-800 px-3.5 py-2 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span>Prioritize Actions 1 – 5</span>
                <span className="text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  {(currentScenario === 1 ? scenario1Rankings.length : scenario3Rankings.length)} / 5 Ranked
                </span>
                <span className="hidden md:inline text-[11px] font-mono text-amber-300/90 font-medium">
                  • Only the FIRST 3 actions will be executed
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={currentScenario === 1 ? submitScenario1 : submitScenario3}
                disabled={(currentScenario === 1 ? scenario1Rankings.length : scenario3Rankings.length) < 3}
                className={`px-4 py-2 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${(currentScenario === 1 ? scenario1Rankings.length : scenario3Rankings.length) >= 3
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
              >
                <span>
                  {(currentScenario === 1 ? scenario1Rankings.length : scenario3Rankings.length) >= 3
                    ? currentScenario === 3
                      ? 'Authorize Top 3 & View Evaluation'
                      : 'Authorize Top 3 & Proceed to Scenario 2'
                    : `Rank At Least 3 Actions (${3 - (currentScenario === 1 ? scenario1Rankings.length : scenario3Rankings.length)} remaining)`}
                </span>
                {currentScenario === 3 ? <Trophy size={13} /> : <Send size={13} />}
              </button>
            </div>
          </div>

          {/* 5 Option Cards Row */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 max-h-[44vh]">
            {(currentScenario === 1 ? PRACTICE_SCENARIO_1.options : PRACTICE_SCENARIO_3.options).map(option => {
              const rankings = currentScenario === 1 ? scenario1Rankings : scenario3Rankings;
              const rankIndex = rankings.indexOf(option.id);
              const isRanked = rankIndex !== -1;
              const isTop3 = isRanked && rankIndex < 3;

              return (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    if (currentScenario === 1) handleToggleScenario1Ranking(option.id);
                    else handleToggleScenario3Ranking(option.id);
                  }}
                  className={`w-64 sm:w-72 lg:w-80 shrink-0 rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all border flex flex-col justify-between select-none ${isTop3
                    ? 'bg-slate-900/95 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/80'
                    : isRanked
                      ? 'bg-slate-900/90 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-950/85 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                >
                  <div>
                    {/* Header: Option Letter & Rank Badge */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black font-mono text-xs ${isTop3
                          ? 'bg-emerald-500 text-black shadow-md'
                          : isRanked
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-slate-800 text-cyan-300 border border-slate-700'
                          }`}>
                          {option.letter}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                          {option.category}
                        </span>
                      </div>

                      {isRanked ? (
                        <span className={`font-black text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${isTop3
                          ? 'bg-emerald-500 text-black'
                          : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                          }`}>
                          <span>RANK #{rankIndex + 1}</span>
                          <span className="text-[9px] opacity-90">{isTop3 ? '• EXECUTED' : '• RESERVE'}</span>
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 text-xs font-mono">
                          +
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-[13px] font-bold text-white leading-snug mb-1">
                      {option.title}
                    </h4>
                    <p className="text-[11px] text-cyan-200/90 font-medium italic mb-2">
                      "{option.tagline}"
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5 line-clamp-3">
                      {option.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono space-y-1">
                    <div className="text-emerald-400 truncate">
                      <span className="font-bold">PRO:</span> {option.pros}
                    </div>
                    <div className="text-amber-400 truncate">
                      <span className="font-bold">CON:</span> {option.cons}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SCENARIO 2: MULTI-SECTOR RESOURCE ALLOCATION (PRESETS & CUSTOM SLIDERS)   */}
      {/* ========================================================================= */}
      {currentScenario === 2 && (
        <section className="relative z-20 w-full px-2 sm:px-4 pb-2 sm:pb-3 max-h-[56vh] flex flex-col justify-end shrink-0 pointer-events-auto">
          {/* Deck Header Bar with Mode Switcher */}
          <div className="flex items-center justify-between gap-2 mb-2 bg-slate-950/95 backdrop-blur-xl border border-slate-800 px-3.5 py-2 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span>{scenario2Mode === 'preset' ? 'Select One Prebuilt Plan' : 'Custom Sector Allocation'}</span>
                <span className="text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  LKR 100M Cap
                </span>
              </h3>

              {/* Presets vs Custom Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setScenario2Mode('preset')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${scenario2Mode === 'preset'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Layers size={12} />
                  <span>Preset Plans</span>
                </button>
                <button
                  onClick={() => setScenario2Mode('custom')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${scenario2Mode === 'custom'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Sliders size={12} />
                  <span>Custom Allocation</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={submitScenario2}
                disabled={
                  scenario2Mode === 'preset'
                    ? (!scenario2PresetPlan || scenario2PresetPlan === '2E')
                    : (scenario2Total <= 0 || scenario2Total > 100)
                }
                className={`px-4 py-2 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${(scenario2Mode === 'preset' ? (scenario2PresetPlan && scenario2PresetPlan !== '2E') : (scenario2Total > 0 && scenario2Total <= 100))
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
              >
                <span>
                  {scenario2Mode === 'preset'
                    ? scenario2PresetPlan === '2E'
                      ? 'PLAN 2E REJECTED (OVER CAP)'
                      : scenario2PresetPlan
                        ? `Authorize Plan [${scenario2PresetPlan}] & Proceed`
                        : 'Select A Plan'
                    : scenario2Total > 100
                      ? `Exceeds 100M (+${scenario2Total - 100}M)`
                      : scenario2Total === 0
                        ? 'Allocate Funds'
                        : `Authorize Allocation (LKR ${scenario2Total}M) & Proceed`}
                </span>
                <Send size={13} />
              </button>
            </div>
          </div>

          {/* Preset Cards Mode */}
          {scenario2Mode === 'preset' && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 max-h-[44vh]">
              {PRACTICE_SCENARIO_2.presetPlans.map(plan => {
                const isSelected = scenario2PresetPlan === plan.id;
                const isOver = plan.isOverLimit;

                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleSelectScenario2PresetPlan(plan)}
                    className={`w-64 sm:w-72 lg:w-80 shrink-0 rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all border flex flex-col justify-between select-none ${isOver
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
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isOver ? 'text-rose-400' : 'text-cyan-400'}`}>
                          {plan.id} • {plan.totalCost}M LKR
                        </span>
                        {isSelected ? (
                          <span className={`text-black font-black text-[10px] font-mono px-2 py-0.5 rounded-full ${isOver ? 'bg-rose-500 text-white' : 'bg-cyan-500'}`}>
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

                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-center mb-1">
                        <div className="bg-slate-900 p-1 rounded border border-slate-800">
                          <span className="text-cyan-400 font-bold block">{plan.allocations.relocationStalls}M</span>
                          <span className="text-[9px] text-slate-500">Stalls</span>
                        </div>
                        <div className="bg-slate-900 p-1 rounded border border-slate-800">
                          <span className="text-amber-400 font-bold block">{plan.allocations.phasedConstruction}M</span>
                          <span className="text-[9px] text-slate-500">Phasing</span>
                        </div>
                        <div className="bg-slate-900 p-1 rounded border border-slate-800">
                          <span className="text-emerald-400 font-bold block">{plan.allocations.livelihoodSupport}M</span>
                          <span className="text-[9px] text-slate-500">Grants</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Custom Sliders Mode */}
          {scenario2Mode === 'custom' && (
            <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl max-h-[44vh] overflow-y-auto">
              {/* Financial Accounting Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pb-3 mb-3 border-b border-slate-800 text-xs font-mono">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">AUTHORIZED GRANT</span>
                  <span className="font-bold text-white text-sm">LKR 100.0M</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">ALLOCATED SPEND</span>
                  <span className={`font-bold text-sm ${scenario2Total > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    LKR {scenario2Total}.0M
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">UNALLOCATED BALANCE</span>
                  <span className={`font-bold text-sm ${scenario2Remaining < 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    LKR {scenario2Remaining}.0M
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">STATUS</span>
                    <span className={`font-bold text-xs ${scenario2Total > 100 ? 'text-rose-400' : scenario2Total === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {scenario2Total > 100 ? 'OVER CAP' : scenario2Total === 100 ? 'BALANCED' : 'UNDER BUDGET'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => applyScenario2QuickPreset(40, 35, 25)}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-[9px] font-mono cursor-pointer"
                    >
                      40/35/25
                    </button>
                    <button
                      onClick={() => applyScenario2QuickPreset(20, 50, 30)}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-400 text-amber-300 text-[9px] font-mono cursor-pointer"
                    >
                      20/50/30
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Slider Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PRACTICE_SCENARIO_2.sectors.map(sector => {
                  const currentValue = scenario2Allocations[sector.key];

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
                              onChange={(e) => handleScenario2CustomSliderChange(sector.key, parseInt(e.target.value) || 0)}
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
                          onChange={(e) => handleScenario2CustomSliderChange(sector.key, parseInt(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* RESULTS DEBRIEF SCREEN (FULL VIEWPORT, PROPERLY POSITIONED, NEVER CUT OFF)*/}
      {/* ========================================================================= */}
      {currentScenario === 4 && results && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-2xl flex flex-col p-3 sm:p-6 md:p-8">
          <div className="w-full max-w-5xl mx-auto bg-slate-950 border border-cyan-500/40 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col space-y-6">
            {/* Top Bar with Score Ring & Tier */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-5">
                {/* Score Ring */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center bg-slate-900 border-4 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.4)] shrink-0 font-mono">
                  <span className="text-2xl sm:text-3xl font-black text-white">{results.score}</span>
                  <span className="text-[9px] uppercase tracking-widest text-cyan-300">/ 100 PTS</span>
                  <span className="text-[9px] text-emerald-400 font-bold mt-0.5">
                    {results.correctCount}/3 Optimal
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="relative h-6 w-32 sm:w-40 overflow-hidden rounded-md bg-white/95 px-1 shrink-0">
                      <Image src="/assets/images/Banner.jpg" alt="Symposium" fill className="object-contain" unoptimized />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border backdrop-blur-md">
                      <span className={results.tierColor.split(' ')[0]}>{results.tier}</span>
                    </div>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                    Practice Simulation Debrief & Strategic Analysis
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mt-1">
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
                  <span>Enter Tournament</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 3 Pillar Score Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {results.pillars.map((pillar, i) => (
                <div key={i} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-300 font-bold uppercase">{pillar.name}</span>
                    <span className="text-xs font-black font-mono text-cyan-400">{pillar.score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden mb-2">
                    <div
                      style={{ width: `${pillar.score}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${pillar.score >= 80 ? 'bg-emerald-400' : pillar.score >= 60 ? 'bg-cyan-400' : 'bg-amber-400'
                        }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>

            {/* 3 Scenario Audit Cards */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles size={13} className="text-cyan-400" />
                <span>Detailed Scenario Audits & Suggested Solutions</span>
              </h3>

              {/* Scenario 1 Audit */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Bus size={15} className="text-cyan-400" />
                    <span className="text-xs font-bold text-white font-mono">
                      {results.scenarioAudits.scenario1.scenarioTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Score:</span>
                    <span className="font-bold text-cyan-400">{results.scenarioAudits.scenario1.score} / {results.scenarioAudits.scenario1.maxScore}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-2 font-sans leading-relaxed">
                  <div className="text-[11px] font-mono text-slate-400">
                    <span className="text-slate-300 font-bold">Your Action Deployment:</span> {results.scenarioAudits.scenario1.userSummary}
                  </div>
                  <div className="text-emerald-300/90 font-medium bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                    <span className="font-bold font-mono text-cyan-400 uppercase text-[10px] block mb-1">
                      Suggested Answer: {results.scenarioAudits.scenario1.suggestedAnswerId}
                    </span>
                    <p className="mb-1 text-slate-200">{results.scenarioAudits.scenario1.suggestedAnswerSummary}</p>
                    <p className="text-[11px] text-slate-400">{results.scenarioAudits.scenario1.suggestedAnswerExplanation}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    <span className="font-bold font-mono text-slate-300">Operational Assessment:</span> {results.scenarioAudits.scenario1.feedback}
                  </p>
                </div>
              </div>

              {/* Scenario 2 Audit */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Train size={15} className="text-amber-400" />
                    <span className="text-xs font-bold text-white font-mono">
                      {results.scenarioAudits.scenario2.scenarioTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Score:</span>
                    <span className="font-bold text-cyan-400">{results.scenarioAudits.scenario2.score} / {results.scenarioAudits.scenario2.maxScore}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-2 font-sans leading-relaxed">
                  <div className="text-[11px] font-mono text-slate-400">
                    <span className="text-slate-300 font-bold">Your Fund Allocation:</span> {results.scenarioAudits.scenario2.userSummary}
                  </div>
                  <div className="text-emerald-300/90 font-medium bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                    <span className="font-bold font-mono text-cyan-400 uppercase text-[10px] block mb-1">
                      Suggested Strategic Resolution: Plan 2A (Option C Approach)
                    </span>
                    <p className="mb-1 text-slate-200">{results.scenarioAudits.scenario2.suggestedAnswerSummary}</p>
                    <p className="text-[11px] text-slate-400">{results.scenarioAudits.scenario2.suggestedAnswerExplanation}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    <span className="font-bold font-mono text-slate-300">Fiscal Assessment:</span> {results.scenarioAudits.scenario2.feedback}
                  </p>
                </div>
              </div>

              {/* Scenario 3 Audit */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className="text-emerald-400" />
                    <span className="text-xs font-bold text-white font-mono">
                      {results.scenarioAudits.scenario3.scenarioTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Score:</span>
                    <span className="font-bold text-cyan-400">{results.scenarioAudits.scenario3.score} / {results.scenarioAudits.scenario3.maxScore}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-2 font-sans leading-relaxed">
                  <div className="text-[11px] font-mono text-slate-400">
                    <span className="text-slate-300 font-bold">Your Action Deployment:</span> {results.scenarioAudits.scenario3.userSummary}
                  </div>
                  <div className="text-emerald-300/90 font-medium bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                    <span className="font-bold font-mono text-cyan-400 uppercase text-[10px] block mb-1">
                      Suggested Answer: {results.scenarioAudits.scenario3.suggestedAnswerId}
                    </span>
                    <p className="mb-1 text-slate-200">{results.scenarioAudits.scenario3.suggestedAnswerSummary}</p>
                    <p className="text-[11px] text-slate-400">{results.scenarioAudits.scenario3.suggestedAnswerExplanation}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    <span className="font-bold font-mono text-slate-300">Rollout Assessment:</span> {results.scenarioAudits.scenario3.feedback}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Planning Principles */}
            <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-4">
              <span className="text-xs font-mono font-bold uppercase text-cyan-300 block mb-2">
                Core Planning Principles & Takeaways:
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {results.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="leading-relaxed">{takeaway}</li>
                ))}
              </ul>
            </div>

            {/* Footer Navigation */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
              <span className="flex flex-wrap items-center gap-1.5">
                <span>Evaluated locally in browser storage</span>
                <span className="text-slate-700">•</span>
                <span>
                  Engineered by{' '}
                  <span className="text-cyan-300 font-bold tracking-wide drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                    OneX Universe (Pvt) Ltd
                  </span>
                </span>
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => { setCurrentScenario(1); setShowBrief(true); }}
                  className="hover:text-cyan-400 underline cursor-pointer"
                >
                  Review Scenario 1
                </button>
                <button
                  onClick={() => { setCurrentScenario(2); setShowBrief(true); }}
                  className="hover:text-cyan-400 underline cursor-pointer"
                >
                  Review Scenario 2
                </button>
                <button
                  onClick={() => { setCurrentScenario(3); setShowBrief(true); }}
                  className="hover:text-cyan-400 underline cursor-pointer"
                >
                  Review Scenario 3
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
