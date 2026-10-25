'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { GameState } from '@/game/state';
import { FinalResult } from '@/game/types';
import {
  LogOut, AlertCircle, Droplets, Coins, RadioTower, Users, Award,
  CheckCircle2, XCircle, ArrowRight,
  Clock, Zap, ShieldAlert
} from 'lucide-react';

interface Props {
  finalState: GameState;
  result: FinalResult;
  teamName: string;
}

export default function ReflectionClient({ finalState, result, teamName }: Props) {
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
          <div className="flex items-center gap-3.5 sm:gap-4 flex-wrap">
            {/* Symposium Official Emblem & Banner */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-xl shrink-0">
              {/* <div className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-xl bg-white/95 p-1 border border-cyan-500/30 shrink-0 shadow flex items-center justify-center">
                <Image src="/assets/images/Logo.jpg" alt="Logo" fill className="object-contain" unoptimized priority />
              </div> */}
              <div className="flex relative h-8 sm:h-10 md:h-12 w-28 sm:w-36 md:w-48 overflow-hidden rounded-xl bg-white/95 px-2 items-center justify-center shadow">
                <Image src="/assets/images/Banner.jpg" alt="Annual Research Symposium 2026" fill className="object-contain" unoptimized priority />
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-xs font-mono text-cyan-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold block mb-1">
                Simulation Debrief // Mission Evaluation
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight break-words">
                {teamName}
              </h1>
            </div>
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



        {/* Crisis Thresholds Grid */}
        <div className="my-6 sm:my-8">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 sm:mb-4">
            Critical Survival Thresholds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {failureItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 sm:p-4 rounded-xl border font-mono text-xs flex flex-col justify-between ${item.failed
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
                    className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-xl transition-all ${isContingency
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
