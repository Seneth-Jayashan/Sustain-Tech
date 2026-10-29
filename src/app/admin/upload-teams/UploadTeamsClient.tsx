'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  Download,
  Users,
  ShieldCheck,
  Terminal,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Play,
  Layers,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
  Mail,
  UserCheck,
  Check,
  FileCheck,
  Info,
  Server,
  Zap,
} from 'lucide-react';
import { notifyConfirm, notifyError, notifySuccess } from '@/lib/notifications';

interface ParsedPlayer {
  roleTitle: string;
  name: string;
  email: string;
  isExisting?: boolean;
}

interface ParsedTeam {
  id: string;
  rowIndex: number;
  groupName: string;
  password: string;
  players: ParsedPlayer[];
  isExistingTeam?: boolean;
  existingTeamId?: string;
  selected: boolean;
}

interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  detail?: string;
}

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const EXTRACT_EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/i;

export default function UploadTeamsClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalLogsEndRef = useRef<HTMLDivElement>(null);

  // Configuration & Target API
  const [targetApiBase, setTargetApiBase] = useState<string>('/api');
  const [customApiUrl, setCustomApiUrl] = useState<string>('https://sustaintech.online/api');
  const [useCustomUrl, setUseCustomUrl] = useState<boolean>(false);

  // File & Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parsing, setParsing] = useState<boolean>(false);
  const [parsedTeams, setParsedTeams] = useState<ParsedTeam[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Existing DB records (for pre-flight validation)
  const [existingTeams, setExistingTeams] = useState<any[]>([]);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [loadingDbState, setLoadingDbState] = useState<boolean>(false);

  // Import options
  const [fallbackPassword, setFallbackPassword] = useState<string>('Sustain@2026');
  const [skipExistingPlayers, setSkipExistingPlayers] = useState<boolean>(true);
  const [mergeExistingTeams, setMergeExistingTeams] = useState<boolean>(true);
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState<boolean>(false);

  // Execution & Progress State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionProgress, setExecutionProgress] = useState<{ current: number; total: number; stage: string }>({
    current: 0,
    total: 0,
    stage: 'Idle',
  });
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [executionSummary, setExecutionSummary] = useState<{
    completed: boolean;
    teamsCreated: number;
    teamsMerged: number;
    playersCreated: number;
    playersSkipped: number;
    errorsCount: number;
  } | null>(null);

  const activeApiUrl = useCustomUrl ? customApiUrl.replace(/\/$/, '') : targetApiBase;

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalLogsEndRef.current) {
      terminalLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Fetch existing teams & users from target API to perform pre-flight collision checks
  const fetchExistingData = async () => {
    setLoadingDbState(true);
    try {
      const [teamsRes, usersRes] = await Promise.all([
        fetch(`${activeApiUrl}/admin/manage-teams`).catch(() => null),
        fetch(`${activeApiUrl}/admin/manage-users`).catch(() => null),
      ]);

      if (teamsRes && teamsRes.ok) {
        const teamsJson = await teamsRes.json();
        if (teamsJson.success && Array.isArray(teamsJson.teams)) {
          setExistingTeams(teamsJson.teams);
        }
      }

      if (usersRes && usersRes.ok) {
        const usersJson = await usersRes.json();
        if (usersJson.success && Array.isArray(usersJson.users)) {
          setExistingUsers(usersJson.users);
        }
      }
    } catch (err) {
      console.warn('Pre-flight check could not reach target API:', err);
    } finally {
      setLoadingDbState(false);
    }
  };

  useEffect(() => {
    fetchExistingData();
  }, [activeApiUrl]);

  const addLog = (level: ExecutionLog['level'], message: string, detail?: string) => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs((prev) => [...prev, { timestamp, level, message, detail }]);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Parser function tailored to sample.xlsx schema
  const processFile = async (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      notifyError('Invalid File Format', 'Please upload a valid Microsoft Excel file (.xlsx, .xls) or CSV file.');
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setLogs([]);
    setExecutionSummary(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Workbook contains no readable sheets');
      }

      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (rawRows.length < 2) {
        throw new Error('Spreadsheet must contain a header row and at least 1 data row.');
      }

      const headerRow = rawRows[0].map((h) => String(h || '').trim().toLowerCase());

      // Find column indices dynamically or fallback to sample.xlsx standards
      const colIndices = {
        groupName: headerRow.findIndex((h) => (h.includes('group') || h.includes('team')) && !h.includes('email') && !h.includes('name')),
        leaderEmail: headerRow.findIndex((h) => h.includes('leader') && (h.includes('email') || h.includes('mail'))),
        leaderName: headerRow.findIndex((h) => h.includes('leader') && h.includes('name')),
        p2Email: headerRow.findIndex((h) => (h.includes('player 2') || h.includes('player2') || h.includes('member 2')) && (h.includes('email') || h.includes('mail'))),
        p2Name: headerRow.findIndex((h) => (h.includes('player 2') || h.includes('player2') || h.includes('member 2')) && h.includes('name')),
        p3Email: headerRow.findIndex((h) => (h.includes('player 3') || h.includes('player3') || h.includes('member 3')) && (h.includes('email') || h.includes('mail'))),
        p3Name: headerRow.findIndex((h) => (h.includes('player 3') || h.includes('player3') || h.includes('member 3')) && h.includes('name')),
        p4Email: headerRow.findIndex((h) => (h.includes('player 4') || h.includes('player4') || h.includes('member 4')) && (h.includes('email') || h.includes('mail'))),
        p4Name: headerRow.findIndex((h) => (h.includes('player 4') || h.includes('player4') || h.includes('member 4')) && h.includes('name')),
        password: headerRow.findIndex((h) => h.includes('pass')),
      };

      // Fallbacks if header matching didn't catch positional columns (as in sample.xlsx: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9)
      if (colIndices.groupName === -1) colIndices.groupName = 0;
      if (colIndices.leaderEmail === -1) colIndices.leaderEmail = 1;
      if (colIndices.leaderName === -1) colIndices.leaderName = 2;
      if (colIndices.p2Email === -1) colIndices.p2Email = 3;
      if (colIndices.p2Name === -1) colIndices.p2Name = 4;
      if (colIndices.p3Email === -1) colIndices.p3Email = 5;
      if (colIndices.p3Name === -1) colIndices.p3Name = 6;
      if (colIndices.p4Email === -1) colIndices.p4Email = 7;
      if (colIndices.p4Name === -1) colIndices.p4Name = 8;
      if (colIndices.password === -1) colIndices.password = 9;

      const teamsList: ParsedTeam[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.every((c) => !c || String(c).trim() === '')) {
          continue; // skip blank rows
        }

        let rawGroupName = String(row[colIndices.groupName] || '').trim();
        let rawLeaderEmail = String(row[colIndices.leaderEmail] || '').trim();
        let rawLeaderName = String(row[colIndices.leaderName] || '').trim();
        let rawP2Email = String(row[colIndices.p2Email] || '').trim();
        let rawP2Name = String(row[colIndices.p2Name] || '').trim();
        let rawP3Email = String(row[colIndices.p3Email] || '').trim();
        let rawP3Name = String(row[colIndices.p3Name] || '').trim();
        let rawP4Email = String(row[colIndices.p4Email] || '').trim();
        let rawP4Name = String(row[colIndices.p4Name] || '').trim();
        let rawPassword = String(row[colIndices.password] || '').trim();

        // Edge case: Group Name contains an email address and leaderEmail is empty (like "Team Exodus sjayashan35@gmail.com")
        if (!rawLeaderEmail && rawGroupName) {
          const match = rawGroupName.match(EXTRACT_EMAIL_REGEX);
          if (match) {
            rawLeaderEmail = match[0];
            rawGroupName = rawGroupName.replace(match[0], '').trim();
          }
        }

        // Clean group name
        const groupName = rawGroupName || `Squad ${i}`;
        const teamPassword = rawPassword || fallbackPassword;

        const players: ParsedPlayer[] = [];

        // Leader
        if (rawLeaderEmail) {
          players.push({
            roleTitle: 'Squad Leader',
            name: rawLeaderName || 'Team Leader',
            email: rawLeaderEmail.toLowerCase().trim(),
          });
        }

        // Player 2
        if (rawP2Email) {
          players.push({
            roleTitle: 'Player 2',
            name: rawP2Name || 'Player 2',
            email: rawP2Email.toLowerCase().trim(),
          });
        }

        // Player 3
        if (rawP3Email) {
          players.push({
            roleTitle: 'Player 3',
            name: rawP3Name || 'Player 3',
            email: rawP3Email.toLowerCase().trim(),
          });
        }

        // Player 4
        if (rawP4Email) {
          players.push({
            roleTitle: 'Player 4',
            name: rawP4Name || 'Player 4',
            email: rawP4Email.toLowerCase().trim(),
          });
        }

        // Cross-reference with existing database items
        const matchingExistingTeam = existingTeams.find(
          (t) => t.name && t.name.toLowerCase().trim() === groupName.toLowerCase().trim()
        );

        // Mark existing players
        players.forEach((p) => {
          const userInDb = existingUsers.some(
            (u) => u.email && u.email.toLowerCase().trim() === p.email.toLowerCase().trim()
          );
          p.isExisting = userInDb;
        });

        const teamId = `team-${i}-${Date.now()}`;
        teamsList.push({
          id: teamId,
          rowIndex: i + 1,
          groupName,
          password: teamPassword,
          players,
          isExistingTeam: Boolean(matchingExistingTeam),
          existingTeamId: matchingExistingTeam?._id,
          selected: true,
        });
      }

      setParsedTeams(teamsList);

      // Expand all by default
      const expMap: Record<string, boolean> = {};
      teamsList.forEach((t) => (expMap[t.id] = true));
      setExpandedTeams(expMap);

      notifySuccess('Spreadsheet Parsed Successfully', `Extracted ${teamsList.length} teams with a total of ${teamsList.reduce((acc, t) => acc + t.players.length, 0)} players.`);
    } catch (err: any) {
      console.error('File parsing error:', err);
      notifyError('Failed to Parse File', err.message || 'Check the Excel file format and try again.');
    } finally {
      setParsing(false);
    }
  };

  // Toggle selection for all or individual
  const toggleSelectAll = (select: boolean) => {
    setParsedTeams((prev) => prev.map((t) => ({ ...t, selected: select })));
  };

  const toggleSelectTeam = (id: string) => {
    setParsedTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const updateTeamPassword = (id: string, newPass: string) => {
    setParsedTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, password: newPass } : t))
    );
  };

  // Execution: Call API sequentially to create teams and players
  const handleDeployBatch = async () => {
    const selectedTeams = parsedTeams.filter((t) => t.selected);
    if (selectedTeams.length === 0) {
      notifyError('No Teams Selected', 'Please select at least one squad to deploy.');
      return;
    }

    const totalPlayersCount = selectedTeams.reduce((acc, t) => acc + t.players.length, 0);

    const isConfirmed = await notifyConfirm(
      'Authorize Deployment',
      `You are about to deploy <strong>${selectedTeams.length} Squads</strong> and <strong>${totalPlayersCount} Players</strong> to <code>${activeApiUrl}</code>.<br/><br/>Each player will be enrolled into their designated team in the database.`,
      { confirmText: 'Execute Deployment', cancelText: 'Review First' }
    );

    if (!isConfirmed) return;

    setIsExecuting(true);
    setLogs([]);
    setExecutionSummary(null);

    addLog('info', `Initializing deployment engine against ${activeApiUrl}...`);
    addLog('info', `Target squads: ${selectedTeams.length} | Target players: ${totalPlayersCount}`);

    let teamsCreated = 0;
    let teamsMerged = 0;
    let playersCreated = 0;
    let playersSkipped = 0;
    let errorsCount = 0;

    const totalSteps = selectedTeams.length + totalPlayersCount;
    let completedSteps = 0;

    setExecutionProgress({
      current: 0,
      total: totalSteps,
      stage: 'Starting provisioning sequence...',
    });

    for (let i = 0; i < selectedTeams.length; i++) {
      const team = selectedTeams[i];
      let assignedTeamId: string | null = null;
      let teamDisplayName = team.groupName;

      setExecutionProgress({
        current: completedSteps,
        total: totalSteps,
        stage: `Squad ${i + 1}/${selectedTeams.length}: Establishing "${team.groupName}"...`,
      });

      // 1. Check or Create Team
      try {
        if (team.isExistingTeam && team.existingTeamId && mergeExistingTeams) {
          assignedTeamId = team.existingTeamId;
          teamsMerged++;
          addLog('info', `Squad "${team.groupName}" already exists. Attaching roster to ID: ${assignedTeamId}`);
        } else {
          addLog('info', `Calling POST ${activeApiUrl}/admin/manage-teams for "${team.groupName}"...`);
          const teamRes = await fetch(`${activeApiUrl}/admin/manage-teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: team.groupName.trim() }),
          });

          const teamData = await teamRes.json();
          if (teamRes.ok && teamData.success && teamData.team) {
            assignedTeamId = teamData.team._id;
            teamDisplayName = teamData.team.name;
            teamsCreated++;
            addLog('success', `[OK] Squad "${teamDisplayName}" established successfully! (ID: ${assignedTeamId})`);
          } else {
            // Check if failure was because team already exists in the backend
            const errMsg = teamData.error || `HTTP ${teamRes.status}`;
            addLog('warn', `Team API returned: ${errMsg}. Attempting lookup...`);

            // Try to lookup if team already created
            const recheck = await fetch(`${activeApiUrl}/admin/manage-teams`).then((r) => r.json()).catch(() => null);
            const found = recheck?.teams?.find(
              (t: any) => t.name.toLowerCase().trim() === team.groupName.toLowerCase().trim()
            );

            if (found && found._id) {
              assignedTeamId = found._id;
              teamsMerged++;
              addLog('info', `Located existing squad ID: ${assignedTeamId}`);
            } else {
              throw new Error(`Failed to create squad "${team.groupName}": ${errMsg}`);
            }
          }
        }
      } catch (err: any) {
        errorsCount++;
        addLog('error', `[ERROR] Failed to establish squad "${team.groupName}": ${err.message}`);
        completedSteps += 1 + team.players.length;
        continue;
      }

      completedSteps++;
      setExecutionProgress({
        current: completedSteps,
        total: totalSteps,
        stage: `Enrolling players for "${teamDisplayName}"...`,
      });

      // 2. Add each player in this team
      for (const player of team.players) {
        setExecutionProgress({
          current: completedSteps,
          total: totalSteps,
          stage: `Enrolling ${player.name} (${player.email})...`,
        });

        // Validation: must have valid email
        if (!EMAIL_REGEX.test(player.email)) {
          errorsCount++;
          addLog('warn', `[SKIPPED] Invalid email format: ${player.email} for player "${player.name}"`);
          completedSteps++;
          continue;
        }

        // Check if skipping existing user
        if (player.isExisting && skipExistingPlayers) {
          playersSkipped++;
          addLog('info', `[SKIPPED] ${player.email} is already registered in system.`);
          completedSteps++;
          continue;
        }

        try {
          const userPayload = {
            name: player.name.trim(),
            email: player.email.toLowerCase().trim(),
            password: (team.password || fallbackPassword).trim(),
            role: 'player',
            teamId: assignedTeamId,
          };

          addLog('info', `Enrolling ${player.roleTitle} ${player.name} (${player.email})...`);

          const userRes = await fetch(`${activeApiUrl}/admin/manage-users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload),
          });

          const userData = await userRes.json();
          if (userRes.ok && userData.success) {
            playersCreated++;
            addLog('success', `[OK] Enrolled ${player.name} (${player.email}) into ${teamDisplayName}`);
          } else {
            const err = userData.error || `HTTP ${userRes.status}`;
            if (err.includes('already exists') && skipExistingPlayers) {
              playersSkipped++;
              addLog('warn', `[EXISTING] ${player.email} is already in database.`);
            } else {
              errorsCount++;
              addLog('error', `[ERROR] Player "${player.name}" (${player.email}): ${err}`);
            }
          }
        } catch (err: any) {
          errorsCount++;
          addLog('error', `[ERROR] Network error enrolling "${player.name}": ${err.message}`);
        }

        completedSteps++;
      }

      // 3. Optional credentials dispatch email
      if (sendCredentialsEmail && assignedTeamId && team.password) {
        try {
          addLog('info', `Dispatching login credentials email to "${teamDisplayName}"...`);
          const credRes = await fetch(`${activeApiUrl}/admin/send-team-credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: assignedTeamId, password: team.password }),
          });
          const credData = await credRes.json();
          if (credRes.ok && credData.success) {
            addLog('success', `[EMAIL SENT] Credentials dispatched to ${credData.sentCount} players of "${teamDisplayName}"`);
          } else {
            addLog('warn', `[EMAIL WARN] Credentials dispatch note: ${credData.error || 'Check mail service settings'}`);
          }
        } catch (mailErr: any) {
          addLog('warn', `[EMAIL FAILED] Could not dispatch credentials: ${mailErr.message}`);
        }
      }
    }

    setExecutionProgress({
      current: totalSteps,
      total: totalSteps,
      stage: 'Deployment Sequence Concluded.',
    });

    setExecutionSummary({
      completed: true,
      teamsCreated,
      teamsMerged,
      playersCreated,
      playersSkipped,
      errorsCount,
    });

    setIsExecuting(false);

    // Refresh existing cache
    fetchExistingData();

    if (errorsCount === 0) {
      notifySuccess(
        'Deployment Complete',
        `Successfully registered ${teamsCreated} new squads and ${playersCreated} players!`
      );
    } else {
      notifySuccess(
        'Deployment Finished with Warnings',
        `Finished: ${teamsCreated} new squads, ${playersCreated} players created, ${playersSkipped} skipped, ${errorsCount} errors. Inspect terminal logs for details.`
      );
    }
  };

  // Calculated totals
  const stats = useMemo(() => {
    const totalTeams = parsedTeams.length;
    const selectedTeamsCount = parsedTeams.filter((t) => t.selected).length;
    const totalPlayers = parsedTeams.reduce((acc, t) => acc + t.players.length, 0);
    const selectedPlayers = parsedTeams
      .filter((t) => t.selected)
      .reduce((acc, t) => acc + t.players.length, 0);
    const existingTeamsCount = parsedTeams.filter((t) => t.isExistingTeam).length;
    const existingPlayersCount = parsedTeams.reduce(
      (acc, t) => acc + t.players.filter((p) => p.isExisting).length,
      0
    );

    return {
      totalTeams,
      selectedTeamsCount,
      totalPlayers,
      selectedPlayers,
      existingTeamsCount,
      existingPlayersCount,
    };
  }, [parsedTeams]);

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white selection:bg-cyan-500/30 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Grid Pattern & Ambience */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px] pointer-events-none z-0"></div>

      {/* Top Header Command Bar */}
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-xl border-b border-blue-900/40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-800/40 font-mono text-xs font-bold transition-all cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Admin Center</span>
          </Link>
          <div className="h-4 w-px bg-blue-900/40 hidden sm:block"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-sm sm:text-base font-black tracking-widest uppercase text-white font-mono flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-400" />
                Batch Roster Ingestion
              </h1>
            </div>
            <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
              Central Command • Automated Excel Spreadsheet Team & Player Deployment
            </p>
          </div>
        </div>

        {/* Target API Endpoint Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <Server size={14} className="text-cyan-400" />
            <span className="text-slate-400">Endpoint:</span>
            <span className="text-cyan-300 font-semibold">{activeApiUrl}</span>
            <button
              onClick={() => fetchExistingData()}
              disabled={loadingDbState}
              className="text-slate-400 hover:text-white ml-1 cursor-pointer"
              title="Refresh database sync"
            >
              <RefreshCw size={13} className={loadingDbState ? 'animate-spin text-cyan-400' : ''} />
            </button>
          </div>

          <a
            href="/sample.xlsx"
            download="sample.xlsx"
            className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/50 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Download</span> sample.xlsx
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 z-10 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* API Target Configuration Card */}
        <div className="bg-slate-950/60 border border-blue-900/40 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Globe size={15} /> API Routing Configuration
            </div>
            <p className="text-xs text-slate-300">
              Configure which backend API processes the <code className="text-cyan-300">/admin/manage-teams</code> and <code className="text-cyan-300">/admin/manage-users</code> calls.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setUseCustomUrl(false)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                  !useCustomUrl
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Current Server (/api)
              </button>
              <button
                type="button"
                onClick={() => setUseCustomUrl(true)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                  useCustomUrl
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Online Production URL
              </button>
            </div>

            {useCustomUrl && (
              <input
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder="https://sustaintech.online/api"
                className="w-full sm:w-64 px-3 py-1.5 bg-black/60 border border-blue-800/50 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            )}
          </div>
        </div>

        {/* Upload Zone & Instructions */}
        {!parsedTeams.length ? (
          <div className="space-y-6">
            {/* Drag & Drop Hero Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-950/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                  : 'border-blue-800/40 bg-black/40 hover:border-cyan-500/60 hover:bg-blue-950/20 shadow-2xl'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInputChange}
              />

              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-5 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all">
                <UploadCloud size={40} className="animate-bounce" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mb-2">
                Drag & Drop Spreadsheet or Click to Browse
              </h2>
              <p className="text-sm font-mono text-slate-300 max-w-lg mb-6">
                Upload your teams Excel document formatted with Squad Names, Leader & Player Emails, Names, and Passwords.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/50 font-mono text-xs text-blue-300 flex items-center gap-1.5">
                  <FileCheck size={14} className="text-emerald-400" /> Compatible: .XLSX / .XLS / .CSV
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 font-mono text-xs text-cyan-300 flex items-center gap-1.5">
                  <Users size={14} className="text-cyan-400" /> Supports 1 to 4+ Players per Squad
                </span>
              </div>
            </div>

            {/* Template Format Visual Guide */}
            <div className="bg-slate-950/60 border border-blue-900/40 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-900/40 pb-4">
                <div>
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <Info size={16} /> Expected Spreadsheet Schema (Matches sample.xlsx)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your Excel sheet can have up to 10 standard columns. Column order is automatically recognized.
                  </p>
                </div>
                <a
                  href="/sample.xlsx"
                  download="sample.xlsx"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 underline"
                >
                  <Download size={14} /> Download Sample Template
                </a>
              </div>

              {/* Table Schema Preview */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-900/40">
                <table className="w-full text-left font-mono text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-blue-950/60 text-cyan-300 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3 border-r border-slate-800">Col A</th>
                      <th className="p-3 border-r border-slate-800">Col B</th>
                      <th className="p-3 border-r border-slate-800">Col C</th>
                      <th className="p-3 border-r border-slate-800">Col D</th>
                      <th className="p-3 border-r border-slate-800">Col E</th>
                      <th className="p-3 border-r border-slate-800">Col F / G</th>
                      <th className="p-3 border-r border-slate-800">Col H / I</th>
                      <th className="p-3">Col J</th>
                    </tr>
                    <tr className="bg-blue-900/30 text-white font-bold border-t border-slate-800">
                      <th className="p-3 border-r border-slate-800">Group Name</th>
                      <th className="p-3 border-r border-slate-800">Leader Email</th>
                      <th className="p-3 border-r border-slate-800">Leader Name</th>
                      <th className="p-3 border-r border-slate-800">Player 2 Email</th>
                      <th className="p-3 border-r border-slate-800">Player 2 Name</th>
                      <th className="p-3 border-r border-slate-800">Player 3 (Mail/Name)</th>
                      <th className="p-3 border-r border-slate-800">Player 4 (Mail/Name)</th>
                      <th className="p-3">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px] bg-black/40">
                    <tr className="hover:bg-blue-950/20">
                      <td className="p-3 font-semibold text-emerald-400 border-r border-slate-800">Team Alpha</td>
                      <td className="p-3 border-r border-slate-800">leader@gmail.com</td>
                      <td className="p-3 border-r border-slate-800">Zaara</td>
                      <td className="p-3 border-r border-slate-800">p2@gmail.com</td>
                      <td className="p-3 border-r border-slate-800">Sama</td>
                      <td className="p-3 border-r border-slate-800">p3@gmail.com (Lalith)</td>
                      <td className="p-3 border-r border-slate-800">p4@gmail.com (S Jay)</td>
                      <td className="p-3 font-mono text-cyan-300">Alpha@753</td>
                    </tr>
                    <tr className="hover:bg-blue-950/20">
                      <td className="p-3 font-semibold text-emerald-400 border-r border-slate-800">
                        Team Exodus <span className="text-slate-500 text-[10px] block">(auto-extracts mail if combined)</span>
                      </td>
                      <td className="p-3 border-r border-slate-800">sjayashan@...</td>
                      <td className="p-3 border-r border-slate-800">S Jayashan</td>
                      <td className="p-3 border-r border-slate-800">seneth@...</td>
                      <td className="p-3 border-r border-slate-800">Seneth J</td>
                      <td className="p-3 border-r border-slate-800 text-slate-500">—</td>
                      <td className="p-3 border-r border-slate-800 text-slate-500">—</td>
                      <td className="p-3 font-mono text-cyan-300">Exodus@159</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Parsed Roster Telemetry & Execution View */
          <div className="space-y-6">
            {/* File Info & Action Bar */}
            <div className="bg-slate-950/70 border border-blue-900/40 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white font-mono">{file?.name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-mono text-emerald-400">
                      Parsed
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400">
                    File size: {((file?.size || 0) / 1024).toFixed(1)} KB • {stats.totalTeams} Squads Detected • {stats.totalPlayers} Players Enrolled
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedTeams([]);
                    setLogs([]);
                    setExecutionSummary(null);
                  }}
                  disabled={isExecuting}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Clear / Re-upload
                </button>

                <button
                  type="button"
                  onClick={handleDeployBatch}
                  disabled={isExecuting || stats.selectedTeamsCount === 0}
                  className={`px-6 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl cursor-pointer ${
                    isExecuting || stats.selectedTeamsCount === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:scale-102 active:scale-98'
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Deploying Squads...
                    </>
                  ) : (
                    <>
                      <Zap size={16} /> Deploy {stats.selectedTeamsCount} Squads ({stats.selectedPlayers} Players)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Metrics Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono">
              <div className="bg-slate-950/60 border border-blue-900/40 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Selected Squads</span>
                <div className="text-2xl font-black text-cyan-400 mt-1">
                  {stats.selectedTeamsCount} <span className="text-xs text-slate-500 font-normal">/ {stats.totalTeams}</span>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-blue-900/40 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Selected Players</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {stats.selectedPlayers} <span className="text-xs text-slate-500 font-normal">/ {stats.totalPlayers}</span>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-blue-900/40 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Existing Squads (DB)</span>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {stats.existingTeamsCount}
                </div>
              </div>
              <div className="bg-slate-950/60 border border-blue-900/40 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Existing Players (DB)</span>
                <div className="text-2xl font-black text-purple-400 mt-1">
                  {stats.existingPlayersCount}
                </div>
              </div>
            </div>

            {/* Deployment Settings / Options Bar */}
            <div className="bg-slate-950/60 border border-blue-900/40 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl space-y-3 font-mono text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-1">
                <ShieldCheck size={16} /> Pre-Deployment Automation Directives
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-700/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={skipExistingPlayers}
                    onChange={(e) => setSkipExistingPlayers(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">Skip Registered Players</span>
                    <span className="text-[10px] text-slate-400">Avoid duplicate user errors</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-700/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={mergeExistingTeams}
                    onChange={(e) => setMergeExistingTeams(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">Attach to Existing Squads</span>
                    <span className="text-[10px] text-slate-400">If team exists, assign players directly</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-700/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={sendCredentialsEmail}
                    onChange={(e) => setSendCredentialsEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">Dispatch Credentials Email</span>
                    <span className="text-[10px] text-slate-400">Email team passwords automatically</span>
                  </div>
                </label>
              </div>

              {/* Default fallback password */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                <span className="text-slate-400 text-[11px]">Fallback Password (for rows missing a password):</span>
                <input
                  type="text"
                  value={fallbackPassword}
                  onChange={(e) => setFallbackPassword(e.target.value)}
                  className="px-3 py-1 bg-black/60 border border-blue-900/60 rounded-lg text-cyan-300 font-mono text-xs w-48 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Execution Progress & Terminal Logs (Shown when running or finished) */}
            {(isExecuting || logs.length > 0) && (
              <div className="bg-black/90 border border-blue-900/60 rounded-2xl overflow-hidden backdrop-blur-2xl shadow-2xl">
                {/* Progress Header */}
                <div className="p-4 bg-slate-950/90 border-b border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 font-mono text-xs">
                    <Terminal size={16} className="text-emerald-400" />
                    <span className="font-bold text-white uppercase tracking-wider">Deployment Pipeline Telemetry</span>
                    <span className="text-slate-400">• {executionProgress.stage}</span>
                  </div>
                  <div className="font-mono text-xs text-slate-300">
                    Progress: {executionProgress.current} / {executionProgress.total} operations
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 h-2">
                  <motion.div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        executionProgress.total > 0
                          ? Math.min(100, (executionProgress.current / executionProgress.total) * 100)
                          : 0
                      }%`,
                    }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>

                {/* Terminal Console Output */}
                <div className="p-4 font-mono text-xs h-64 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-blue-900/40">
                  {logs.map((log, index) => {
                    const colorClass =
                      log.level === 'success'
                        ? 'text-emerald-400'
                        : log.level === 'warn'
                        ? 'text-amber-400'
                        : log.level === 'error'
                        ? 'text-red-400'
                        : 'text-cyan-300';

                    return (
                      <div key={index} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-600 select-none">[{log.timestamp}]</span>
                        <span className={`font-semibold ${colorClass}`}>{log.message}</span>
                        {log.detail && <span className="text-slate-500 font-normal">({log.detail})</span>}
                      </div>
                    );
                  })}
                  <div ref={terminalLogsEndRef} />
                </div>

                {/* Execution Finished Summary Banner */}
                {executionSummary && (
                  <div className="p-4 bg-emerald-950/30 border-t border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      <span>
                        Deployment Sequence Completed: <strong>{executionSummary.teamsCreated}</strong> squads created,{' '}
                        <strong>{executionSummary.playersCreated}</strong> players enrolled,{' '}
                        <strong>{executionSummary.playersSkipped}</strong> skipped,{' '}
                        <strong>{executionSummary.errorsCount}</strong> errors.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/admin"
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md"
                      >
                        View in Teams Roster
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Parsed Squads List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-white uppercase tracking-wider">Preview of Extracted Squads</span>
                  <span className="text-slate-500">({parsedTeams.length} total)</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="text-slate-400 hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {parsedTeams.map((team) => {
                  const isExpanded = expandedTeams[team.id] ?? true;
                  const showPass = showPasswords[team.id] ?? false;

                  return (
                    <div
                      key={team.id}
                      className={`bg-slate-950/60 border rounded-2xl overflow-hidden backdrop-blur-md transition-all shadow-lg ${
                        team.selected ? 'border-blue-900/50' : 'border-slate-800/40 opacity-60'
                      }`}
                    >
                      {/* Squad Header */}
                      <div className="p-4 bg-gradient-to-r from-blue-950/40 to-transparent border-b border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={team.selected}
                            onChange={() => toggleSelectTeam(team.id)}
                            className="w-4 h-4 rounded text-blue-600 accent-blue-500 focus:ring-0 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTeams((prev) => ({ ...prev, [team.id]: !isExpanded }))
                            }
                            className="w-7 h-7 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400 hover:bg-blue-800/40 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black font-mono uppercase tracking-wider text-white">
                                {team.groupName}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-[10px] font-mono text-cyan-300">
                                {team.players.length} {team.players.length === 1 ? 'Player' : 'Players'}
                              </span>
                              {team.isExistingTeam && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/50 text-[10px] font-mono text-amber-300 flex items-center gap-1">
                                  <AlertTriangle size={11} /> Existing Team in DB
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              Row #{team.rowIndex} in spreadsheet
                            </span>
                          </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
                          <Lock size={13} className="text-slate-400" />
                          <span className="text-slate-400 text-[10px]">Password:</span>
                          <input
                            type={showPass ? 'text' : 'password'}
                            value={team.password}
                            onChange={(e) => updateTeamPassword(team.id, e.target.value)}
                            className="bg-transparent text-cyan-300 font-mono text-xs focus:outline-none w-28 sm:w-36"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({ ...prev, [team.id]: !showPass }))
                            }
                            className="text-slate-400 hover:text-white cursor-pointer"
                          >
                            {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Players Roster Table */}
                      {isExpanded && (
                        <div className="p-4 overflow-x-auto">
                          <table className="w-full text-left font-mono text-xs">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 pb-2">
                              <tr>
                                <th className="pb-2 font-medium">Slot</th>
                                <th className="pb-2 font-medium">Player Name</th>
                                <th className="pb-2 font-medium">Player Email</th>
                                <th className="pb-2 font-medium">Role</th>
                                <th className="pb-2 font-medium text-right">DB Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-xs">
                              {team.players.map((player, pIdx) => (
                                <tr key={pIdx} className="hover:bg-blue-950/10">
                                  <td className="py-2 text-slate-500">#{pIdx + 1}</td>
                                  <td className="py-2 font-bold text-slate-200">{player.name}</td>
                                  <td className="py-2 text-cyan-300">
                                    <div className="flex items-center gap-1.5">
                                      <Mail size={12} className="text-slate-500" />
                                      {player.email}
                                    </div>
                                  </td>
                                  <td className="py-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        player.roleTitle.includes('Leader')
                                          ? 'bg-amber-950/50 text-amber-300 border border-amber-800/40'
                                          : 'bg-blue-950/40 text-blue-300 border border-blue-800/30'
                                      }`}
                                    >
                                      {player.roleTitle}
                                    </span>
                                  </td>
                                  <td className="py-2 text-right">
                                    {player.isExisting ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-[10px] text-purple-300 font-bold">
                                        <UserCheck size={11} /> Registered
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] text-emerald-400 font-bold">
                                        <Check size={11} /> New User
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
