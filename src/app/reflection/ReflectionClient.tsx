'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '@/game/state';
import { FinalResult, ScoreCalculationDetails } from '@/game/types';
import { 
  LogOut, ShieldCheck, AlertCircle, Droplets, Coins, RadioTower, Users, Award, 
  CheckCircle2, XCircle, ArrowRight, Calculator, ChevronDown, ChevronUp, Info,
  Clock, Zap, ShieldAlert
} from 'lucide-react';

interface Props {
  finalState: GameState;
  result: FinalResult;
  teamName: string;
}

export default function ReflectionClient({ finalState, result, teamName }: Props) {
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [auditTab, setAuditTab] = useState<'cps' | 'tpi'>('cps');
  const scores = finalState.scores;
  const resources = finalState.resources;
  const information = finalState.information;
  const community = finalState.community;
  
  const getRatingBadge = (tier: string) => {
    if (tier?.includes('Tier 1')) {
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]' };
    } else if (tier?.includes('Tier 2')) {
      return { color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]' };
    } else if (tier?.includes('Tier 3')) {
      return { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' };
    } else {
      return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]' };
    }
  };

  const badge = getRatingBadge(result.endingTier || result.rating);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const metrics = [
    { label: 'Flood Resilience', val: scores.floodPreparedness, icon: Droplets, color: 'text-blue-400', bar: 'bg-blue-500' },
    { label: 'Drought Resilience', val: scores.droughtPreparedness, icon: Droplets, color: 'text-amber-400', bar: 'bg-amber-500' },
    { label: 'Fiscal Management', val: scores.resourceScore, icon: Coins, color: 'text-emerald-400', bar: 'bg-emerald-500' },
    { label: 'Information Quality', val: information.informationQuality, icon: RadioTower, color: 'text-cyan-400', bar: 'bg-cyan-500' },
    { label: 'Community Trust', val: community.communityTrust, icon: Users, color: 'text-purple-400', bar: 'bg-purple-500' },
    { label: 'Decision Quality', val: scores.decisionQuality, icon: Award, color: 'text-rose-400', bar: 'bg-rose-500' },
  ];

  const failureItems = [
    { 
      label: 'Fiscal Solvency', 
      failed: result.failureStates?.fiscalInsolvency, 
      metric: resources.emergencyBudget < 0 
        ? `-LKR ${Math.abs(Math.round(resources.emergencyBudget))}M Drawn (${Math.max(0, 200 - Math.abs(Math.round(resources.emergencyBudget)))}M Facility Avail)` 
        : `LKR ${Math.round(resources.emergencyBudget)}M Remaining`, 
      threshold: '> 0M Cash Reserve (Deficit Penalty)' 
    },
    { label: 'Flood Defense Basin', failed: result.failureStates?.catastrophicInundation, metric: `${Math.round(scores.floodPreparedness)}% Prep`, threshold: '≥ 35%' },
    { label: 'Dry Zone Water Storage', failed: result.failureStates?.droughtShock, metric: `${Math.round(scores.droughtPreparedness)}% Storage`, threshold: '≥ 30%' },
    { label: 'Public Order & Civic Trust', failed: result.failureStates?.civilBreakdown, metric: `${Math.round(community.communityTrust)}% Trust`, threshold: '≥ 25%' },
  ];

  const fallbackCount = result.fallbackInterventionsCount ?? finalState.decisionHistory?.filter((d: any) => d.fallbackApplied || d.emergencyFallback || d.isSystemContingency).length ?? 0;
  const humanCount = result.humanDecisionsCount ?? finalState.decisionHistory?.filter((d: any) => !(d.fallbackApplied || d.emergencyFallback || d.isSystemContingency)).length ?? (6 - fallbackCount);
  const failurePoints = Object.values(result.failureStates || {}).filter(Boolean).length * 12;
  const timeoutPoints = fallbackCount * 10;
  const baseSum = Math.round((0.25 * scores.floodPreparedness + 0.25 * scores.droughtPreparedness + 0.20 * scores.resourceScore + 0.15 * information.informationQuality + 0.15 * community.communityTrust) * 10) / 10;
  const subtotalClamped = Math.max(0, Math.min(100, baseSum - failurePoints - timeoutPoints));
  const mult = humanCount / 6;

  const defaultCalc: ScoreCalculationDetails = {
    weightedComponents: [
      { label: 'Flood Resilience', rawScore: Math.round(scores.floodPreparedness), weightPercent: 25, contribution: Math.round(0.25 * scores.floodPreparedness * 10) / 10 },
      { label: 'Drought Resilience', rawScore: Math.round(scores.droughtPreparedness), weightPercent: 25, contribution: Math.round(0.25 * scores.droughtPreparedness * 10) / 10 },
      { label: 'Fiscal Management', rawScore: Math.round(scores.resourceScore), weightPercent: 20, contribution: Math.round(0.20 * scores.resourceScore * 10) / 10 },
      { label: 'Information Quality', rawScore: Math.round(information.informationQuality), weightPercent: 15, contribution: Math.round(0.15 * information.informationQuality * 10) / 10 },
      { label: 'Community Trust', rawScore: Math.round(community.communityTrust), weightPercent: 15, contribution: Math.round(0.15 * community.communityTrust * 10) / 10 },
    ],
    baselineWeightedSum: baseSum,
    breachedFailuresCount: Object.values(result.failureStates || {}).filter(Boolean).length,
    failurePenaltyPoints: failurePoints,
    humanDecisionsCount: humanCount,
    fallbackCount: fallbackCount,
    fallbackInterventionPenalty: timeoutPoints,
    timeoutDeduction: timeoutPoints,
    participationMultiplier: Math.round(mult * 1000) / 1000,
    clampedSubtotal: subtotalClamped,
    allTimeoutZeroOverride: humanCount === 0,
    scoreAfterPenalties: subtotalClamped,
    curveAdjustment: 0,
    finalCps: result.cps,
    arithmeticMean: Math.round(((scores.floodPreparedness + scores.droughtPreparedness + scores.resourceScore + information.informationQuality + community.communityTrust + scores.decisionQuality) / 6) * 10) / 10,
    explanation: 'Score calculated from exact linear formula.'
  };

  const calc = result.calculationDetails || defaultCalc;

  const tpiData = result.tpiDetails || {
    components: [
      { pillar: 'Disaster Outcomes & Preparedness', weightPercent: 35, rawScore: Math.round(result.cps), weightedContribution: Math.round(result.cps * 0.35 * 10) / 10, description: 'Flood & drought resilience baseline' },
      { pillar: 'Decision Quality', weightPercent: 20, rawScore: Math.round(scores.decisionQuality), weightedContribution: Math.round(scores.decisionQuality * 0.20 * 10) / 10, description: 'Appropriateness of selected operational directives' },
      { pillar: 'Resource & Financial Management', weightPercent: 15, rawScore: Math.round(scores.resourceScore), weightedContribution: Math.round(scores.resourceScore * 0.15 * 10) / 10, description: 'Treasury stewardship and debt discipline' },
      { pillar: 'Response Speed & Command Agility', weightPercent: 10, rawScore: 80, weightedContribution: 8.0, description: 'Composure and decision velocity under timer pressure' },
      { pillar: 'Community Protection & Equity', weightPercent: 10, rawScore: Math.round(community.communityTrust), weightedContribution: Math.round(community.communityTrust * 0.10 * 10) / 10, description: 'Civic trust, compliance, and public health preservation' },
      { pillar: 'Recovery Readiness', weightPercent: 10, rawScore: 70, weightedContribution: 7.0, description: 'Post-disaster operational capacity on Day 10' },
    ],
    totalTpi: result.tpi ?? result.cps,
    averageDecisionTimeSeconds: 45,
    timeoutsCount: 0,
    fallbacksCount: 0
  };

  const totalCampaignSeconds = result.tpiDetails?.totalDecisionTimeSeconds !== undefined
    ? result.tpiDetails.totalDecisionTimeSeconds
    : (finalState.decisionHistory?.length
      ? finalState.decisionHistory.reduce((acc: number, d: any) => acc + (d.responseTimeMs ? Math.round(d.responseTimeMs / 1000) : (d.timeSpentSeconds || 0)), 0)
      : Math.round(tpiData.averageDecisionTimeSeconds * 6));

  const formatMinutesSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="w-full max-w-5xl py-4 sm:py-8 px-2 sm:px-4 font-sans text-slate-200">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative bg-slate-950/80 backdrop-blur-2xl border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 shadow-2xl overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500"></div>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 sm:pb-8 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] sm:text-xs font-mono text-cyan-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold block mb-1">
              Simulation Debrief // Mission Evaluation
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight break-words">
              {teamName}
            </h1>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900/80 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-700/80 hover:border-red-500/50 rounded-xl transition-all font-mono text-xs uppercase tracking-wider self-stretch sm:self-auto justify-center"
          >
            <LogOut size={15} /> Disconnect
          </button>
        </div>

        {/* Core Scorecard Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 my-6 sm:my-8 items-stretch">
          
          {/* Main CPS Banner */}
          <div className={`md:col-span-5 p-5 sm:p-8 rounded-2xl border ${badge.border} ${badge.bg} ${badge.glow} flex flex-col justify-between relative overflow-hidden backdrop-blur-xl`}>
            <div>
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-400 font-bold block mb-2">
                Composite Preparedness Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tighter ${badge.color}`}>
                  {result.cps.toFixed(1)}
                </span>
                <span className="text-slate-500 font-mono text-base sm:text-xl">/ 100</span>
              </div>

              <div className="mt-3 sm:mt-4">
                <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg border font-mono font-black text-xs uppercase tracking-wider ${badge.border} ${badge.color} bg-black/40`}>
                  {result.endingTier || result.rating}
                </span>
              </div>

              {/* TPI Dual Score & Agility Metric Cards */}
              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-white/10">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                    Team Perf. Index
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
                      {tpiData.totalTpi.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">TPI</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <Zap size={10} className="text-cyan-400 shrink-0" /> Leaderboard Score
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                    Campaign Time
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-black font-mono text-emerald-400">
                      {formatMinutesSeconds(totalCampaignSeconds)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">/ 20m</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-emerald-400 shrink-0" /> 1200s allowance
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                    Command Velocity
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-black font-mono text-amber-300">
                      {Math.round(tpiData.averageDecisionTimeSeconds)}s
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">avg/rnd</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-amber-400 shrink-0" /> 
                    {tpiData.timeoutsCount > 0 ? `${tpiData.timeoutsCount} Timeout(s)` : 'Zero Timeouts'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10 space-y-2.5 sm:space-y-3 font-mono text-xs text-slate-300">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Primary Hazard Bias:</span>
                <span className={`font-bold uppercase ${result.pathway === 'Flood' ? 'text-blue-400' : 'text-amber-400'}`}>
                  {result.pathway} Dominant
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Final Treasury Balance:</span>
                <span className={`font-bold text-right ${resources.emergencyBudget <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {resources.emergencyBudget < 0
                    ? `-LKR ${Math.abs(Math.round(resources.emergencyBudget))}M (${Math.max(0, 200 - Math.abs(Math.round(resources.emergencyBudget)))}M Avail)`
                    : `LKR ${Math.round(resources.emergencyBudget)}M / 500M`}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Emergency Interventions:</span>
                <span className={`font-bold text-right ${tpiData.fallbacksCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {tpiData.fallbacksCount > 0 ? `${tpiData.fallbacksCount} Contingency Fallback(s)` : '100% Autonomous Orders'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Campaign Timeline:</span>
                <span className="font-bold text-white text-right">
                  Day 10 (6 Buckets Complete)
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Breakdown Bars */}
          <div className="md:col-span-7 bg-slate-900/50 border border-slate-800/80 p-5 sm:p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 font-bold mb-4 sm:mb-6">
                Strategic Diagnostic Breakdown
              </h2>

              <div className="space-y-3.5 sm:space-y-4">
                {metrics.map((m) => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="flex items-center gap-2 text-slate-300">
                        <m.icon size={13} className={m.color} />
                        {m.label}
                      </span>
                      <span className={`font-black ${m.color}`}>
                        {Math.round(m.val)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, m.val))}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full ${m.bar} shadow-[0_0_10px_currentColor]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500">
              <span>National Disaster Management Framework</span>
              <span>v3.2 Production</span>
            </div>
          </div>
        </div>

        {/* Expandable Score Calculation Breakdown */}
        <div className="my-6 sm:my-8">
          <button
            id="toggle-score-calculation"
            type="button"
            onClick={() => setShowCalculationDetails(!showCalculationDetails)}
            aria-expanded={showCalculationDetails}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                <Calculator size={18} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>How Your Scores Were Calculated</span>
                  <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
                    Audit Engine
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-sans leading-snug">
                  Compare CPS ({result.cps.toFixed(1)}) defense score and TPI ({tpiData.totalTpi.toFixed(1)}) team performance index
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 group-hover:text-cyan-400 transition-colors font-mono text-xs shrink-0 ml-2">
              <span className="hidden md:inline">{showCalculationDetails ? 'Hide Audit' : 'Show Formula & Weights'}</span>
              {showCalculationDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          <AnimatePresence>
            {showCalculationDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 overflow-hidden"
              >
                {/* Audit Tab Switcher */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <button
                    type="button"
                    onClick={() => setAuditTab('cps')}
                    className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                      auditTab === 'cps'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <ShieldCheck size={14} /> CPS Defense Audit (5 Pillars)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditTab('tpi')}
                    className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                      auditTab === 'tpi'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Zap size={14} /> Team Performance Index (TPI - 6 Pillars)
                  </button>
                </div>

                {auditTab === 'cps' ? (
                  <>
                    {/* 1. Component Contributions Table */}
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold mb-3 flex items-center gap-2">
                        <Info size={14} /> 1. Strategic Pillar Weighting (Total 100%)
                      </h3>
                      <div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
                        <table className="w-full min-w-[460px] text-left font-mono text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                              <th className="pb-2 font-semibold">Pillar Indicator</th>
                              <th className="pb-2 font-semibold text-right">Indicator Score</th>
                              <th className="pb-2 font-semibold text-right">Weight</th>
                              <th className="pb-2 font-semibold text-right">Weighted Contribution</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {calc.weightedComponents.map((c: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-800/30">
                                <td className="py-2.5 text-white font-medium">
                                  {c.label}
                                </td>
                                <td className="py-2.5 text-right font-bold text-slate-200">
                                  {c.rawScore}%
                                </td>
                                <td className="py-2.5 text-right text-cyan-400">
                                  {c.weightPercent}%
                                </td>
                                <td className="py-2.5 text-right font-black text-emerald-400">
                                  +{c.contribution.toFixed(1)} pts
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-slate-700 bg-slate-800/40 font-bold text-white">
                              <td className="py-2.5" colSpan={3}>
                                Weighted Baseline Subtotal
                              </td>
                              <td className="py-2.5 text-right text-emerald-300 font-black">
                                {calc.baselineWeightedSum.toFixed(1)} pts
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2. Command Interventions & Crisis Deductions */}
                    <div className="pt-4 border-t border-slate-800">
                      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400 font-bold mb-3 flex items-center gap-2">
                        <AlertCircle size={14} /> 2. Crisis Thresholds &amp; Command Interventions
                      </h3>
                      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs font-mono">
                        {/* Baseline */}
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Weighted Baseline (B):</span>
                          <span className="font-black text-emerald-400">
                            {calc.baselineWeightedSum.toFixed(1)} pts
                          </span>
                        </div>

                        {/* Crisis Thresholds */}
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Breached Crisis Thresholds (P):</span>
                          <span className={`font-black ${calc.breachedFailuresCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {calc.breachedFailuresCount} {calc.breachedFailuresCount === 1 ? 'condition' : 'conditions'}
                            {calc.failurePenaltyPoints > 0 ? ` (-${calc.failurePenaltyPoints.toFixed(1)} pts @ 3 pts/breach)` : ' (0.0 pts)'}
                          </span>
                        </div>

                        {/* Timeout Deductions */}
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Contingency Fallback Deductions (2 × F):</span>
                          <span className={`font-black ${(calc.fallbackCount ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {calc.fallbackCount ?? 0} {calc.fallbackCount === 1 ? 'round' : 'rounds'}
                            {(calc.fallbackCount ?? 0) > 0 ? ` (-${((calc.timeoutDeduction ?? (calc.fallbackCount ?? 0) * 2)).toFixed(1)} pts @ 2 pts/round)` : ' (0.0 pts)'}
                          </span>
                        </div>

                        {/* Clamped Subtotal */}
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/60 text-slate-300">
                          <span>Clamped Subtotal [clamp(B - P - 2×F, 0, 100)]:</span>
                          <span className="font-black text-cyan-300">
                            {(calc.clampedSubtotal ?? calc.scoreAfterPenalties).toFixed(1)} pts
                          </span>
                        </div>

                        {/* Human Participation Coverage */}
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Human-Authorized Rounds (H):</span>
                          <span className="font-black text-white">
                            {calc.humanDecisionsCount ?? 6} / 6 rounds
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Participation Multiplier (H / 6):</span>
                          <span className="font-black text-purple-400">
                            ×{(calc.participationMultiplier ?? ((calc.humanDecisionsCount ?? 6) / 6)).toFixed(3)} ({(((calc.participationMultiplier ?? ((calc.humanDecisionsCount ?? 6) / 6))) * 100).toFixed(1)}%)
                          </span>
                        </div>

                        {/* All-Timeout Rule Notice */}
                        {calc.allTimeoutZeroOverride ? (
                          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-[11px] leading-relaxed mt-2">
                            <strong className="block text-red-400 font-bold mb-0.5">All-Timeout Command Autopilot Rule:</strong>
                            All 6 decision rounds expired without human command authorization (H = 0). Automated contingencies executed emergency autopilot protocols. By rule, system fallbacks cannot receive a positive command-performance score. Authoritative CPS is 0.0 / 100 (Tier 4).
                          </div>
                        ) : (
                          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 font-bold text-white">
                            <span>Final Adjusted Score [Subtotal × (H / 6)]:</span>
                            <span className="text-cyan-400 font-black">{result.cps.toFixed(1)} pts</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Reconciliation & Strategic Gates */}
                    <div className="pt-4 border-t border-slate-800 space-y-3 text-xs font-mono">
                      <h3 className="uppercase tracking-[0.2em] text-purple-400 font-bold flex items-center gap-2">
                        <Award size={14} /> 3. Reconciliation &amp; Strategic Gates
                      </h3>
                      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-slate-300">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span>Reconciliation Formula:</span>
                          <span className="text-slate-300 sm:text-right font-bold">
                            clamp({calc.baselineWeightedSum.toFixed(1)} - {calc.failurePenaltyPoints.toFixed(1)} - {((calc.timeoutDeduction ?? (calc.fallbackCount ?? 0) * 10)).toFixed(1)}, 0, 100) × ({calc.humanDecisionsCount ?? 6}/6) = {result.cps.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span>Decision Quality ({Math.round(scores.decisionQuality)}%):</span>
                          <span className="text-slate-400 sm:text-right">
                            Strategic Gate (Requires ≥ 65% for Tier 1; docked on fallback interventions)
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 font-bold text-white text-sm">
                          <span>Final Composite Preparedness Score:</span>
                          <span className="text-cyan-400 font-mono font-black text-base">{result.cps.toFixed(1)} / 100</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-slate-300 text-[11px] leading-relaxed font-sans">
                        <strong className="text-cyan-400 font-mono block mb-1">
                          {calc.allTimeoutZeroOverride
                            ? 'Why CPS is 0.0 (All-Timeout Command Autopilot Rule):'
                            : `Why CPS (${result.cps.toFixed(1)}) Reconciles with the Tournament Formula:`}
                        </strong>
                        {calc.allTimeoutZeroOverride ? (
                          <>
                            The command team did not submit decisions within any of the six decision windows (0 human decisions, 6 fallback interventions). While the contingency system executed automated autopilot protocols to safeguard infrastructure (yielding a simulated physical baseline of {calc.baselineWeightedSum.toFixed(1)} pts), automated system interventions cannot produce a positive human command score. The final team Command Preparedness Score is 0.0 / 100 (Tier 4: Systemic Crisis).
                          </>
                        ) : (
                          <>
                            The Composite Preparedness Score is calculated as {calc.baselineWeightedSum.toFixed(1)} (weighted baseline across 5 defense pillars) minus {calc.failurePenaltyPoints.toFixed(1)} pts from {calc.breachedFailuresCount} breached crisis threshold(s) and minus {((calc.timeoutDeduction ?? (calc.fallbackCount ?? 0) * 10)).toFixed(1)} pts from {calc.fallbackCount ?? 0} timeout intervention(s), yielding a clamped subtotal of {(calc.clampedSubtotal ?? calc.scoreAfterPenalties).toFixed(1)} pts. Multiplying by the human participation ratio of {calc.humanDecisionsCount ?? 6}/6 ({(((calc.participationMultiplier ?? ((calc.humanDecisionsCount ?? 6) / 6))) * 100).toFixed(1)}%) yields the final tournament CPS of {result.cps.toFixed(1)} pts. {result.failureStates?.fiscalInsolvency ? `The fiscal solvency breach represents a sovereign governance penalty for operating on emergency credit overdraft (-LKR ${Math.abs(Math.round(resources.emergencyBudget))}M drawn); the Emergency Credit Facility maintains LKR ${Math.max(0, 200 - Math.abs(Math.round(resources.emergencyBudget)))}M in available borrowing capacity before reaching the hard freeze limit.` : 'All provincial fiscal and lifeline operations operated within approved reserve thresholds.'}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* TPI 6-Pillar Audit Section */}
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400 font-bold mb-3 flex items-center gap-2">
                        <Zap size={14} /> Team Performance Index (TPI) 6-Pillar Weighting (Total 100%)
                      </h3>
                      <div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
                        <table className="w-full min-w-[500px] text-left font-mono text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                              <th className="pb-2 font-semibold">TPI Pillar</th>
                              <th className="pb-2 font-semibold">Description</th>
                              <th className="pb-2 font-semibold text-right">Score</th>
                              <th className="pb-2 font-semibold text-right">Weight</th>
                              <th className="pb-2 font-semibold text-right">Contribution</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {tpiData.components.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/30">
                                <td className="py-2.5 text-white font-medium">{p.pillar}</td>
                                <td className="py-2.5 text-slate-400 text-[11px] max-w-[200px] truncate">{p.description}</td>
                                <td className="py-2.5 text-right font-bold text-slate-200">{Math.round(p.rawScore)}%</td>
                                <td className="py-2.5 text-right text-amber-400">{p.weightPercent}%</td>
                                <td className="py-2.5 text-right font-black text-emerald-400">+{p.weightedContribution.toFixed(1)} pts</td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-slate-700 bg-slate-800/40 font-bold text-white">
                              <td className="py-2.5" colSpan={4}>Total Team Performance Index (TPI)</td>
                              <td className="py-2.5 text-right text-amber-300 font-black">{tpiData.totalTpi.toFixed(1)} / 100</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Operational Velocity & Timeouts Card */}
                    <div className="pt-4 border-t border-slate-800">
                      <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold mb-3 flex items-center gap-2">
                        <Clock size={14} /> Operational Velocity &amp; Server-Enforced Timeouts
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                          <span className="text-slate-400 text-[10px] uppercase block mb-1">Total Campaign Time</span>
                          <span className="text-emerald-400 font-black text-base">{formatMinutesSeconds(totalCampaignSeconds)}</span>
                          <span className="text-[10px] text-slate-500 block mt-1">Planned cap: 20m 00s (1200s)</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                          <span className="text-slate-400 text-[10px] uppercase block mb-1">Average Response Speed</span>
                          <span className="text-amber-300 font-black text-base">{Math.round(tpiData.averageDecisionTimeSeconds)}s per round</span>
                          <span className="text-[10px] text-slate-500 block mt-1">Weighted into TPI (10%)</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                          <span className="text-slate-400 text-[10px] uppercase block mb-1">Enforced Timeouts</span>
                          <span className={`font-black text-base ${tpiData.timeoutsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tpiData.timeoutsCount} Expired Deadlines
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">Server clock enforcement</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                          <span className="text-slate-400 text-[10px] uppercase block mb-1">Contingency Fallbacks</span>
                          <span className={`font-black text-base ${tpiData.fallbacksCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {tpiData.fallbacksCount} Interventions
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">Auto-completed directives</span>
                        </div>
                      </div>

                      <div className="mt-4 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-slate-300 text-[11px] leading-relaxed font-sans">
                        <strong className="text-amber-400 font-mono block mb-1">Leaderboard Principle: Decisive Execution Under Time Pressure</strong>
                        The Team Performance Index evaluates both technical disaster preparedness (35%) and the human quality of incident command: strategic decision quality (20%), fiscal discipline (15%), command agility without panic (10%), community trust &amp; equitable care (10%), and day 10 recovery readiness (10%). Fast teams do not automatically win if their directives trigger catastrophic failures; the best teams make effective, sound decisions under tight deadlines.
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Crisis Thresholds Grid */}
        <div className="my-6 sm:my-8">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 sm:mb-4">
            Critical Survival Thresholds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {failureItems.map((item, idx) => (
              <div 
                key={idx}
                className={`p-3.5 sm:p-4 rounded-xl border font-mono text-xs flex flex-col justify-between ${
                  item.failed 
                    ? 'bg-red-950/20 border-red-500/40 text-red-300' 
                    : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{item.label}</span>
                  {item.failed ? <XCircle size={16} className="text-red-400 shrink-0" /> : <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                </div>
                <div>
                  <div className="text-white font-black text-sm">{item.metric}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Threshold: {item.threshold}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Trade-offs Box */}
        {result.tradeoffs && result.tradeoffs.length > 0 && (
          <div className="my-6 sm:my-8 bg-slate-900/40 border border-slate-800/80 p-4 sm:p-6 rounded-2xl">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400 font-bold mb-3 flex items-center gap-2">
              <AlertCircle size={15} /> Strategic Trade-Off Analysis
            </h3>
            <ul className="space-y-2 font-mono text-xs text-slate-300">
              {result.tradeoffs.map((to, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{to}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Authoritative Mission Decision History */}
        {finalState.decisionHistory && finalState.decisionHistory.length > 0 && (
          <div className="my-6 sm:my-8 bg-slate-900/60 border border-slate-800/80 p-4 sm:p-6 md:p-8 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold block">
                  Authoritative Incident Timeline
                </span>
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide mt-0.5">
                  Round-by-Round Operational Decisions &amp; Contingency Audit
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={13} /> Autonomous
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <ShieldAlert size={13} /> Fallback
                </span>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {finalState.decisionHistory.map((rec: any, idx: number) => {
                const isContingency = Boolean(rec.fallbackApplied || rec.emergencyFallback);
                const isTimeout = Boolean(rec.timedOut || rec.timeoutOccurred);
                const responseSecs = rec.responseTimeMs ? Math.round(rec.responseTimeMs / 1000) : (rec.timeSpentSeconds || 0);

                return (
                  <div
                    key={idx}
                    className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-xl transition-all ${
                      isContingency
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-cyan-950 border border-cyan-800 text-cyan-300">
                          Day {rec.day ?? (rec.bucket - 1) * 2}
                        </span>
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {rec.scenarioTitle || `Round ${rec.bucket}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isContingency ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-bold text-[10px] uppercase flex items-center gap-1">
                            <ShieldAlert size={11} /> Contingency Fallback (System Authorized)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-[10px] uppercase flex items-center gap-1">
                            <CheckCircle2 size={11} /> Command Directives (Human Authorized)
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock size={11} className={isTimeout ? 'text-red-400' : 'text-slate-400'} />
                          {responseSecs}s {isTimeout && '(Timeout)'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 text-xs font-mono space-y-1.5">
                      {/* Executed Directives */}
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                          Executed Directives:
                        </span>
                        {rec.actionTitles && rec.actionTitles.length > 0 ? (
                          <ul className="space-y-1">
                            {rec.actionTitles.map((t: string, i: number) => (
                              <li key={i} className="text-slate-200 flex items-start gap-1.5 text-[11px]">
                                <span className="text-cyan-400 mt-0.5">•</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        ) : rec.rankings && rec.rankings.length > 0 ? (
                          <div className="text-slate-300 text-[11px]">
                            Prioritized: {rec.rankings.slice(0, 3).join(', ')}
                          </div>
                        ) : rec.allocations ? (
                          <div className="text-slate-300 text-[11px]">
                            Allocations: {JSON.stringify(rec.allocations)}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px]">Standard directives mobilized</div>
                        )}
                      </div>

                      {/* Financial Effects */}
                      {rec.financialEffects && (
                        <div className="pt-1.5 mt-1.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                          <span>
                            Net Treasury Delta:{' '}
                            <strong className={rec.financialEffects.budgetDelta < 0 ? 'text-red-400' : 'text-emerald-400'}>
                              {rec.financialEffects.budgetDelta <= 0
                                ? `-LKR ${Math.abs(Math.round(rec.financialEffects.budgetDelta))}M`
                                : `+LKR ${Math.round(rec.financialEffects.budgetDelta)}M`}
                            </strong>
                          </span>
                          <span>
                            Post-Round Treasury Balance:{' '}
                            <strong className={rec.financialEffects.treasuryRemaining < 0 ? 'text-red-400' : 'text-white'}>
                              {rec.financialEffects.treasuryRemaining < 0
                                ? `-LKR ${Math.abs(Math.round(rec.financialEffects.treasuryRemaining))}M (Overdraft)`
                                : `LKR ${Math.round(rec.financialEffects.treasuryRemaining)}M`}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Narrative Evaluation Box */}
        <div className="bg-black/50 border border-slate-800/80 p-4 sm:p-6 md:p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500"></div>
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold mb-2">
            Executive Mission Analysis
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed font-sans">
            &quot;{result.summary || 'Strategic decision sequence concluded. Preparedness and community resilience have been recorded in the central repository.'}&quot;
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] sm:text-xs font-mono text-slate-500 text-center sm:text-left">
            SustainTech Simulation Engine // Verified Playthrough Complete
          </span>

          <button
            id="reflection-end-session"
            onClick={handleLogout}
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-mono text-xs uppercase tracking-widest px-6 py-3.5 sm:py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] text-center cursor-pointer active:scale-95"
          >
            End Session
          </button>
        </div>
      </motion.div>
    </div>
  );
}
