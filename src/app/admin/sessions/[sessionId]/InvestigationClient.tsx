'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, Clock, Zap, Trophy, Timer, AlertTriangle, 
  ArrowLeft, Download, FileText, Activity, Users, Coins, Droplets, 
  Layers, CheckCircle2, XCircle, Search, ExternalLink, RefreshCw,
  Eye, Terminal, AlertCircle, Info, ChevronRight, ChevronDown, ChevronUp
} from 'lucide-react';
import { notifyInfo } from '@/lib/notifications';

interface InvestigationClientProps {
  sessionId: string;
}

export default function InvestigationClient({ sessionId }: InvestigationClientProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rounds' | 'integrity' | 'financial' | 'scoring' | 'team'>('rounds');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high_priority' | 'review_signal' | 'info'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchInvestigationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const json = await res.json();
      if (!json.success || !json.investigation) {
        throw new Error(json.error || 'Failed to load forensic data');
      }
      setData(json.investigation);
    } catch (err: any) {
      console.error('Forensic investigation fetch error:', err);
      setError(err.message || 'Error loading forensic investigation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigationData();
  }, [sessionId]);

  // Export handlers
  const handleExportJSON = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sustain-tech-forensic-${data.sessionIdentity.teamName.replace(/\s+/g, '_')}-${sessionId.slice(-6)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notifyInfo('Forensic JSON Exported', 'Complete session forensic dataset downloaded.');
  };

  const handleExportCSV = () => {
    if (!data) return;
    const lines: string[] = [];

    // 1. Session Identity
    lines.push('--- SESSION IDENTITY ---');
    lines.push('Session ID,Team Name,Status,Tournament Rank,Ending Tier,CPS,TPI,Total Campaign Time (s),Timeouts Count');
    lines.push([
      `"${data.sessionIdentity.sessionId}"`,
      `"${data.sessionIdentity.teamName}"`,
      `"${data.sessionIdentity.status}"`,
      data.tournamentScore.tournamentRank || 'N/A',
      `"${data.tournamentScore.endingTier}"`,
      data.tournamentScore.cps ?? 'N/A',
      data.tournamentScore.tpi ?? 'N/A',
      data.tournamentScore.totalCampaignSeconds,
      data.tournamentScore.timeoutsCount
    ].join(','));
    lines.push('');

    // 2. Round-by-Round Decisions
    lines.push('--- SCENARIO DECISION AUDIT ---');
    lines.push('Round,Day,Scenario Title,Presented Card Order,Submitted Rankings,Executed Actions,Response Time (s),Round Duration (s),Timed Out,Fallback Applied,Authorized By,User ID');
    data.roundsAudit.forEach((r: any) => {
      lines.push([
        r.round,
        r.day,
        `"${r.scenarioTitle}"`,
        `"${r.presentedCards.join(' > ')}"`,
        `"${r.submittedRankings.join(' > ')}"`,
        `"${r.executedActions.map((a: any) => a.id).join(' + ')}"`,
        r.timing.responseTimeSeconds ?? 'N/A',
        r.timing.roundDurationSeconds,
        r.timing.timedOut ? 'YES' : 'NO',
        r.intervention.fallbackApplied ? 'YES' : 'NO',
        `"${r.attribution.userName}"`,
        `"${r.attribution.userId || ''}"`
      ].join(','));
    });
    lines.push('');

    // 3. Financial Ledger
    lines.push('--- FINANCIAL AUDIT LEDGER ---');
    lines.push('Round,Day,Event,Expenditure (M),Grant (M),Net Delta (M),Ending Balance (M),Credit Drawn (M),Available Facility (M)');
    data.financialLedger.forEach((f: any) => {
      lines.push([
        f.round,
        f.day,
        `"${f.event}"`,
        f.expenditure,
        f.grant,
        f.netDelta,
        f.endingBalance,
        f.creditDrawn,
        f.availableCredit
      ].join(','));
    });
    lines.push('');

    // 4. Integrity Log Timeline
    lines.push('--- TOURNAMENT INTEGRITY TIMELINE ---');
    lines.push('Server Timestamp,Action Type,Severity,Round,Day,User Name,User ID,Forensic Metadata');
    data.integrityLogs.forEach((l: any) => {
      lines.push([
        `"${l.serverTimestamp || l.createdAt}"`,
        `"${l.actionType}"`,
        `"${l.severity}"`,
        l.round || 'N/A',
        l.day ?? 'N/A',
        `"${l.userName || ''}"`,
        `"${l.userId || ''}"`,
        `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`
      ].join(','));
    });

    const csvStr = lines.join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sustain-tech-audit-${data.sessionIdentity.teamName.replace(/\s+/g, '_')}-${sessionId.slice(-6)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notifyInfo('Forensic CSV Exported', 'CSV spreadsheet downloaded.');
  };

  const filteredLogs = useMemo(() => {
    if (!data?.integrityLogs) return [];
    if (severityFilter === 'all') return data.integrityLogs;
    return data.integrityLogs.filter((l: any) => l.severity === severityFilter);
  }, [data, severityFilter]);

  const activeRoundData = useMemo(() => {
    if (!data?.roundsAudit) return null;
    return data.roundsAudit.find((r: any) => r.round === selectedRound) || data.roundsAudit[0];
  }, [data, selectedRound]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-mono p-4">
        <RefreshCw size={36} className="text-cyan-400 animate-spin mb-4" />
        <span className="text-base font-black tracking-widest text-cyan-300">RETRIEVING FORENSIC AUDIT RECORD...</span>
        <span className="text-xs text-slate-500 mt-1">Reconstructing session ledger, event chronology and competitor attribution</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-mono p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-2xl p-6 text-center shadow-2xl">
          <AlertCircle size={42} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-black text-white mb-2">Forensic Investigation Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Session could not be located in database.'}</p>
          <button
            onClick={() => router.push('/admin')}
            className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Admin Console
          </button>
        </div>
      </div>
    );
  }

  const { sessionIdentity, tournamentScore, roundsAudit, financialLedger, integritySummary } = data;

  const formatMinutesSeconds = (totalSecs: number) => {
    if (!totalSecs || isNaN(totalSecs)) return '00m 00s';
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Return to Admin Overview"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded">
                  Admin Forensic Audit
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                  sessionIdentity.status === 'COMPLETED'
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                }`}>
                  {sessionIdentity.status}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
                <span>{sessionIdentity.teamName}</span>
                <span className="text-xs font-mono font-normal text-slate-400">({sessionIdentity.sessionId})</span>
              </h1>
            </div>
          </div>

          {/* Action buttons: Export CSV & JSON */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Download CSV spreadsheet of entire session"
            >
              <FileText size={13} className="text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              title="Download full JSON dataset"
            >
              <Download size={13} className="text-cyan-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tournament Result */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-cyan-500/30 relative overflow-hidden shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Tournament Standing</span>
              {tournamentScore.tournamentRank && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black flex items-center gap-1">
                  <Trophy size={11} className="text-amber-400" /> Rank #{tournamentScore.tournamentRank}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-3 my-1">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 block uppercase">CPS Score</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                  {tournamentScore.cps !== null ? Number(tournamentScore.cps).toFixed(1) : '--'}
                </span>
              </div>
              <div className="border-l border-slate-700/80 pl-3">
                <span className="text-[10px] font-mono text-amber-400 block uppercase">TPI Index</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                  {tournamentScore.tpi !== null ? Number(tournamentScore.tpi).toFixed(1) : '--'}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Outcome Tier:</span>
              <span className="font-bold text-white text-right">{tournamentScore.endingTier}</span>
            </div>
          </div>

          {/* Card 2: Decision Velocity & Timing */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Time Analytics</span>
              <Clock size={14} className="text-emerald-400" />
            </div>
            <div className="my-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Campaign Decision Time</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {formatMinutesSeconds(tournamentScore.totalCampaignSeconds)}
                </span>
                <span className="text-xs font-mono text-slate-500">/ 20m cap</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Avg Speed:</span>
              <span className="font-bold text-amber-300">{Math.round(tournamentScore.averageResponseSpeedSeconds)}s per round</span>
            </div>
          </div>

          {/* Card 3: Survival Thresholds & Solvency */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Survival Posture</span>
              <Activity size={14} className="text-cyan-400" />
            </div>
            <div className="my-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Critical Threshold Breaches</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black font-mono ${
                  tournamentScore.breachedFailuresCount > 0 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {tournamentScore.breachedFailuresCount} / 4
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {tournamentScore.breachedFailuresCount === 0 ? 'Optimal Solvency' : 'Threshold Breached'}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Human Decisions:</span>
              <span className="font-bold text-cyan-300">{tournamentScore.humanDecisionsCount} of 6 authorized</span>
            </div>
          </div>

          {/* Card 4: Integrity Signals & Review Flags */}
          <div className={`p-4 rounded-2xl bg-slate-900/70 border relative overflow-hidden shadow-lg backdrop-blur-md ${
            integritySummary.highPriorityCount > 0 
              ? 'border-red-500/50 bg-red-950/10' 
              : integritySummary.reviewSignalCount > 0 
              ? 'border-amber-500/40 bg-amber-950/10' 
              : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="uppercase tracking-wider">Integrity Audit</span>
              <ShieldAlert size={14} className={integritySummary.highPriorityCount > 0 ? 'text-red-400 animate-pulse' : 'text-cyan-400'} />
            </div>
            <div className="my-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Integrity Events</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {integritySummary.totalEvents}
                </span>
                <span className="text-xs font-mono text-slate-400">events recorded</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono flex items-center justify-between gap-1">
              <span className="px-1.5 py-0.5 rounded bg-red-950/50 border border-red-500/40 text-red-300">
                {integritySummary.highPriorityCount} High
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-500/40 text-amber-300">
                {integritySummary.reviewSignalCount} Signals
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {integritySummary.infoCount} Info
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'rounds', label: 'Scenario Decisions (6 Rounds)', icon: Layers },
            { id: 'integrity', label: `Integrity Log (${integritySummary.totalEvents})`, icon: ShieldAlert },
            { id: 'financial', label: 'Financial Audit Ledger', icon: Coins },
            { id: 'scoring', label: 'Score Calculations', icon: Trophy },
            { id: 'team', label: `Team Attribution (${sessionIdentity.assignedCompetitors.length})`, icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Round Decisions Drill-Down */}
        {activeTab === 'rounds' && (
          <div className="space-y-6">
            {/* Round Selector Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {roundsAudit.map((r: any) => {
                const isSelected = selectedRound === r.round;
                const isFallback = r.intervention.fallbackApplied;
                const isTimedOut = r.timing.timedOut;
                return (
                  <button
                    key={r.round}
                    onClick={() => setSelectedRound(r.round)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer font-mono ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                      <span>Round {r.round}</span>
                      <span className="font-bold text-cyan-400">Day {r.day}</span>
                    </div>
                    <div className="text-xs font-black text-white mt-1 truncate">
                      {r.scenarioTitle}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                      {isFallback ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-400 font-bold">
                          Fallback
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold">
                          Human Auth
                        </span>
                      )}
                      {r.timing.responseTimeSeconds !== null && (
                        <span className="text-slate-400">{r.timing.responseTimeSeconds}s</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Round Drill-Down Content */}
            {activeRoundData && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl backdrop-blur-md">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                        Round {activeRoundData.round} • Day {activeRoundData.day} Scenario Analysis
                      </span>
                      {activeRoundData.intervention.fallbackApplied ? (
                        <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 font-mono text-[10px] font-bold">
                          Automated Timeout Fallback
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-bold">
                          Verified Human Action
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                      {activeRoundData.scenarioTitle}
                    </h2>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block">Response Speed</span>
                      <span className="text-base font-bold text-amber-300">
                        {activeRoundData.timing.responseTimeSeconds !== null ? `${activeRoundData.timing.responseTimeSeconds}s` : '--'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/ {activeRoundData.timing.roundDurationSeconds}s allowed</span>
                    </div>
                    <div className="text-right border-l border-slate-800 pl-4">
                      <span className="text-[10px] text-slate-400 uppercase block">Authorized By</span>
                      <span className="text-xs font-bold text-cyan-300 block truncate max-w-[150px]">
                        {activeRoundData.attribution.userName}
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        {activeRoundData.attribution.userId ? `ID: ${String(activeRoundData.attribution.userId).slice(-6)}` : 'System generated'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scenario Narrative Text */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">Situation Briefing:</span>
                  <p className="whitespace-pre-line">{activeRoundData.situation}</p>
                </div>

                {/* Timing & Submission Telemetry Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Server Round Start</span>
                    <span className="font-bold text-white text-xs block truncate mt-1">
                      {activeRoundData.timing.roundStartedAt ? new Date(activeRoundData.timing.roundStartedAt).toLocaleTimeString() : '--'}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate">
                      {activeRoundData.timing.roundStartedAt || 'Not initiated'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Server Deadline</span>
                    <span className="font-bold text-white text-xs block truncate mt-1">
                      {activeRoundData.timing.roundDeadlineAt ? new Date(activeRoundData.timing.roundDeadlineAt).toLocaleTimeString() : '--'}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate">
                      {activeRoundData.timing.roundDeadlineAt || 'No deadline'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Decision Submitted At</span>
                    <span className="font-bold text-white text-xs block truncate mt-1">
                      {activeRoundData.timing.decisionSubmittedAt ? new Date(activeRoundData.timing.decisionSubmittedAt).toLocaleTimeString() : '--'}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate">
                      {activeRoundData.timing.decisionSubmittedAt || 'Pending'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Execution Verdict</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      {activeRoundData.timing.timedOut ? (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <XCircle size={13} /> Timed Out (+{activeRoundData.timing.overtimeSeconds}s)
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={13} /> On Time ({activeRoundData.timing.timeRemainingSeconds}s remain)
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      {activeRoundData.intervention.fallbackApplied ? 'Contingency policy applied' : 'Legitimate competitor action'}
                    </span>
                  </div>
                </div>

                {/* Action Card Randomization Audit: Presented vs Submitted */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Seeded Presentation Order
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">Mulberry32 Shuffle</span>
                    </div>
                    <div className="flex flex-wrap gap-2 font-mono text-xs">
                      {activeRoundData.presentedCards.map((cardId: string, idx: number) => (
                        <span key={cardId} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          #{idx + 1}: <strong className="text-cyan-300">{cardId}</strong>
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 mt-2">
                      Card display slots randomized deterministically to prevent pattern-memorization without changing costs or impacts.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Submitted Priorities Order
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">Top 3 Authorized</span>
                    </div>
                    <div className="flex flex-wrap gap-2 font-mono text-xs">
                      {activeRoundData.submittedRankings.length > 0 ? (
                        activeRoundData.submittedRankings.map((cardId: string, idx: number) => (
                          <span key={cardId} className={`px-2.5 py-1 rounded border ${
                            idx < 3 
                              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 font-bold' 
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            P{idx + 1}: {cardId}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">No rankings recorded (preset or allocation mode)</span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 mt-2">
                      Top 3 prioritized options were approved by simulation engine and committed to the authoritative ledger.
                    </p>
                  </div>
                </div>

                {/* Executed Directives List */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-3 flex items-center gap-1.5">
                    <Terminal size={14} /> Executed Operations &amp; Resource Consequences
                  </h3>
                  {activeRoundData.executedActions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {activeRoundData.executedActions.map((action: any) => (
                        <div key={action.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-xs font-mono mb-1">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                                {action.id}
                              </span>
                              <span className={`font-bold ${action.cost < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {action.cost < 0 ? `-LKR ${Math.abs(action.cost)}M` : `+LKR ${action.cost}M`}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-white leading-snug mt-1">
                              {action.title}
                            </h4>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-0.5">
                            {action.impacts.floodPreparedness && (
                              <div className="flex justify-between">
                                <span>Flood Preparedness:</span>
                                <span className={action.impacts.floodPreparedness > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {action.impacts.floodPreparedness > 0 ? `+${action.impacts.floodPreparedness}%` : `${action.impacts.floodPreparedness}%`}
                                </span>
                              </div>
                            )}
                            {action.impacts.droughtPreparedness && (
                              <div className="flex justify-between">
                                <span>Drought Preparedness:</span>
                                <span className={action.impacts.droughtPreparedness > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {action.impacts.droughtPreparedness > 0 ? `+${action.impacts.droughtPreparedness}%` : `${action.impacts.droughtPreparedness}%`}
                                </span>
                              </div>
                            )}
                            {action.impacts.communityTrust && (
                              <div className="flex justify-between">
                                <span>Community Trust:</span>
                                <span className={action.impacts.communityTrust > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {action.impacts.communityTrust > 0 ? `+${action.impacts.communityTrust}%` : `${action.impacts.communityTrust}%`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeRoundData.allocations ? (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
                      <span className="text-[10px] text-slate-400 uppercase block mb-2">Resource Allocation Directives:</span>
                      <pre className="text-cyan-300 text-xs overflow-x-auto">
                        {JSON.stringify(activeRoundData.allocations, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-slate-500 italic">No action records executed for this round.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tournament Integrity Log & Signals */}
        {activeTab === 'integrity' && (
          <div className="space-y-4">
            {/* Severity Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-400 text-[11px] uppercase mr-2">Filter Severity:</span>
                {[
                  { id: 'all', label: `All (${integritySummary.totalEvents})` },
                  { id: 'high_priority', label: `High Priority (${integritySummary.highPriorityCount})` },
                  { id: 'review_signal', label: `Review Signals (${integritySummary.reviewSignalCount})` },
                  { id: 'info', label: `Info (${integritySummary.infoCount})` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSeverityFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      severityFilter === f.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <Info size={13} className="text-cyan-400" />
                <span>Signals reflect review evidence, not automated disqualifications</span>
              </div>
            </div>

            {/* Event Timeline Table */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert size={14} className="text-cyan-400" /> Chronological Integrity Event Log
                </span>
                <span className="text-slate-400">{filteredLogs.length} events displayed</span>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-mono text-xs">
                  No telemetry events match the selected severity filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 font-mono text-xs">
                  {filteredLogs.map((log: any) => {
                    const isExpanded = expandedLogId === log._id;
                    const isHigh = log.severity === 'high_priority';
                    const isSignal = log.severity === 'review_signal';
                    return (
                      <div key={log._id} className="p-3.5 sm:p-4 hover:bg-slate-800/30 transition-colors">
                        <div 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none"
                          onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Severity Badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                              isHigh 
                                ? 'bg-red-950/80 border-red-500/60 text-red-300' 
                                : isSignal 
                                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300' 
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}>
                              {log.severity || 'info'}
                            </span>

                            <div className="min-w-0">
                              <span className="text-white font-bold block truncate">
                                {log.actionType}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Round {log.round ?? 'N/A'} (Day {log.day ?? 'N/A'})</span>
                                <span>•</span>
                                <span className="text-cyan-300">{log.userName || 'Anonymous'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] text-slate-400">
                              {new Date(log.serverTimestamp || log.createdAt).toLocaleTimeString()}
                            </span>
                            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-400">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Forensic Metadata */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-slate-800 text-[11px] space-y-2"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                              <div>Server Timestamp: <span className="text-white">{log.serverTimestamp || log.createdAt}</span></div>
                              <div>Competitor User ID: <span className="text-cyan-300">{log.userId}</span></div>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-slate-500 uppercase block mb-1">Event Payload &amp; Forensic Attributes:</span>
                              <pre className="text-cyan-300 text-[10px] overflow-x-auto leading-relaxed">
                                {JSON.stringify(log.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Financial Ledger Audit */}
        {activeTab === 'financial' && (
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Coins size={14} className="text-amber-400" /> Authoritative Fiscal Audit Ledger (LKR Millions)
              </span>
              <span className="text-slate-400">Initial Balance: LKR 500.0M • Max Credit: LKR 200.0M</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead className="bg-slate-950/60 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Round</th>
                    <th className="p-3">Scenario Event</th>
                    <th className="p-3 text-right">Expenditure</th>
                    <th className="p-3 text-right">Grants/Inflow</th>
                    <th className="p-3 text-right">Net Change</th>
                    <th className="p-3 text-right">Ending Balance</th>
                    <th className="p-3 text-right">Credit Drawn</th>
                    <th className="p-3 text-right">Available Facility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {financialLedger.map((row: any, i: number) => {
                    const isDeficit = row.endingBalance < 0;
                    return (
                      <tr key={i} className={`hover:bg-slate-800/20 transition-colors ${i === 0 ? 'bg-cyan-950/10' : ''}`}>
                        <td className="p-3 font-bold text-cyan-300">
                          {row.round === 0 ? 'Init' : `Day ${row.day}`}
                        </td>
                        <td className="p-3 text-white font-bold max-w-xs truncate">
                          {row.event}
                        </td>
                        <td className="p-3 text-right text-red-400">
                          {row.expenditure > 0 ? `-LKR ${row.expenditure}M` : '--'}
                        </td>
                        <td className="p-3 text-right text-emerald-400">
                          {row.grant > 0 ? `+LKR ${row.grant}M` : '--'}
                        </td>
                        <td className={`p-3 text-right font-bold ${row.netDelta < 0 ? 'text-red-400' : row.netDelta > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {row.netDelta < 0 ? `-LKR ${Math.abs(row.netDelta)}M` : row.netDelta > 0 ? `+LKR ${row.netDelta}M` : 'LKR 0M'}
                        </td>
                        <td className={`p-3 text-right font-bold text-sm ${isDeficit ? 'text-red-400' : 'text-emerald-300'}`}>
                          LKR {row.endingBalance}M
                        </td>
                        <td className="p-3 text-right text-amber-300">
                          {row.creditDrawn > 0 ? `LKR ${row.creditDrawn}M` : 'LKR 0M'}
                        </td>
                        <td className="p-3 text-right text-slate-300">
                          LKR {row.availableCredit}M
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Score Calculation Reconciliations */}
        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CPS Score Calculation Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                  <ShieldCheck size={16} /> Composite Performance Score (CPS) Audit
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  Authoritative tournament formula: <code className="text-cyan-300">CPS = clamp(Base - Penalties - 10*F, 0, 100) * (H/6)</code>
                </p>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Base Pillar Weights:</span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Flood Preparedness (25%):</span>
                      <span className="text-white">{data.rawState.scores.floodPreparedness}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Drought Preparedness (25%):</span>
                      <span className="text-white">{data.rawState.scores.droughtPreparedness}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Community Trust (20%):</span>
                      <span className="text-white">{data.rawState.scores.communityTrust}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Treasury Reserves (15%):</span>
                      <span className="text-white">LKR {data.rawState.resources.emergencyBudget}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Decision Quality (15%):</span>
                      <span className="text-white">{data.rawState.scores.decisionQuality || 50}%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Penalties &amp; Adjustments:</span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Breached Failure Deductions:</span>
                      <span className="text-red-400 font-bold">-{tournamentScore.breachedFailuresCount * 15} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fallback Intervention Penalties:</span>
                      <span className="text-red-400 font-bold">-{tournamentScore.timeoutsCount * 10} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Participation Factor:</span>
                      <span className="text-cyan-300 font-bold">x {tournamentScore.participationMultiplier} ({tournamentScore.humanDecisionsCount}/6 rounds)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex items-center justify-between text-sm">
                    <span className="text-cyan-400 font-bold">Final CPS Score:</span>
                    <span className="text-2xl font-black text-cyan-300">
                      {tournamentScore.cps !== null ? Number(tournamentScore.cps).toFixed(1) : '--'} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* TPI Score Calculation Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-2">
                  <Zap size={16} /> Team Performance Index (TPI) Audit
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  Six multi-hazard operational dimensions weighted to 100%
                </p>

                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Overall Resilience (35%):</span>
                      <span className="text-white font-bold">{tournamentScore.tpiDetails.resilienceScore?.toFixed(1) || '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Financial Prudence (20%):</span>
                      <span className="text-white font-bold">{tournamentScore.tpiDetails.financialPrudenceScore?.toFixed(1) || '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Decision Quality (15%):</span>
                      <span className="text-white font-bold">{tournamentScore.tpiDetails.decisionQualityScore?.toFixed(1) || '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Command Velocity (10%):</span>
                      <span className="text-white font-bold">{tournamentScore.tpiDetails.timeScore?.toFixed(1) || '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hazard Balance (10%):</span>
                      <span className="text-white font-bold">{tournamentScore.tpiDetails.hazardBalanceScore?.toFixed(1) || '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Civil Stability (10%):</span>
                      <span className="text-white font-bold">{tournamentScore.tpiDetails.civilStabilityScore?.toFixed(1) || '--'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between text-sm">
                    <span className="text-amber-400 font-bold">Final TPI Index:</span>
                    <span className="text-2xl font-black text-amber-300">
                      {tournamentScore.tpi !== null ? Number(tournamentScore.tpi).toFixed(1) : '--'} / 100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Competitor Attribution Roster */}
        {activeTab === 'team' && (
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users size={14} className="text-cyan-400" /> Assigned Competitors &amp; Decision Attribution Roster
              </span>
              <span className="text-slate-400">{sessionIdentity.assignedCompetitors.length} registered teammates</span>
            </div>

            <div className="divide-y divide-slate-800/80 font-mono text-xs">
              {sessionIdentity.assignedCompetitors.map((user: any) => {
                const userRounds = roundsAudit.filter((r: any) => r.attribution.userId === user.id);
                return (
                  <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">{user.name}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {user.role}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">{user.email}</span>
                      <span className="text-[10px] text-slate-500 block">User ID: {user.id}</span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase block">Rounds Authorized:</span>
                      <div className="flex items-center gap-1.5 mt-1 sm:justify-end">
                        {userRounds.length > 0 ? (
                          userRounds.map((r: any) => (
                            <span key={r.round} className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                              R{r.round} (Day {r.day})
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic">No submissions authorized</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
