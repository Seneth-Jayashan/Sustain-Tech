'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Droplets, Coins, LogOut, RefreshCcw, ChevronDown, ChevronUp, 
  Activity, Users, LayoutDashboard, Settings, FileText, Database, Plus, Trash2, 
  Save, Edit3, X, UserPlus, CheckCircle2, AlertCircle, ArrowUp, ArrowDown,
  Layers, Link2, ShieldCheck, UserCheck, Search, Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'scenarios'>('overview');
  
  // Data states
  const [sessions, setSessions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [allActions, setAllActions] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  // Modals state
  const [teamModal, setTeamModal] = useState<{ open: boolean; mode: 'create' | 'edit'; team?: any }>({ open: false, mode: 'create' });
  const [playerModal, setPlayerModal] = useState<{ open: boolean; mode: 'create' | 'edit'; teamId?: string; player?: any }>({ open: false, mode: 'create' });
  const [adminModal, setAdminModal] = useState<{ open: boolean; mode: 'create' | 'edit'; adminUser?: any }>({ open: false, mode: 'create' });
  
  const [scenarioModal, setScenarioModal] = useState<{ open: boolean; mode: 'create' | 'edit'; scenario?: any }>({ open: false, mode: 'create' });
  const [addActionModal, setAddActionModal] = useState<{ open: boolean; scenario?: any }>({ open: false });
  const [editActionModal, setEditActionModal] = useState<{ open: boolean; action?: any }>({ open: false });

  // Form states for modals
  const [teamForm, setTeamForm] = useState({ name: '' });
  const [playerForm, setPlayerForm] = useState({ name: '', email: '', password: '', teamId: '' });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  
  const [scenarioForm, setScenarioForm] = useState({ scenarioId: '', title: '', situation: '', day: 0 });
  const [actionSourceMode, setActionSourceMode] = useState<'dropdown' | 'create'>('dropdown');
  const [selectedDropdownActionId, setSelectedDropdownActionId] = useState('');
  const [newActionForm, setNewActionForm] = useState({
    actionId: '',
    title: '',
    description: '',
    floodPreparedness: 0,
    droughtPreparedness: 0,
    emergencyBudget: 0,
    communityTrust: 0,
    informationQuality: 0
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch('/api/admin/teams');
        const data = await res.json();
        if (data.success) setSessions(data.sessions || []);
      } else if (activeTab === 'teams') {
        const [teamsRes, usersRes] = await Promise.all([
          fetch('/api/admin/manage-teams'),
          fetch('/api/admin/manage-users')
        ]);
        const teamsData = await teamsRes.json();
        const usersData = await usersRes.json();
        
        if (teamsData.success) {
          setTeams(teamsData.teams || []);
          // Auto-expand all teams by default
          const exp: Record<string, boolean> = {};
          (teamsData.teams || []).forEach((t: any) => { exp[t._id] = true; });
          setExpandedTeams(exp);
        }
        if (usersData.success) {
          setAllUsers(usersData.users || []);
        }
      } else if (activeTab === 'scenarios') {
        const res = await fetch('/api/admin/manage-scenarios');
        const data = await res.json();
        if (data.success) {
          setScenarios(data.scenarios || []);
          setAllActions(data.allActions || []);
        }
      }
    } catch (e) {
      console.error(e);
      showNotification('error', 'Error synchronizing administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'overview') {
      const interval = setInterval(fetchData, 6000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // -------------------------------------------------------------
  // GAME SESSION HANDLERS
  // -------------------------------------------------------------
  const handleDeleteSession = async (sessionId: string, teamName?: string) => {
    const isAll = sessionId === 'all';
    const confirmMsg = isAll 
      ? 'Are you sure you want to delete ALL game sessions? All active and completed simulations will be erased so teams can restart from Day 0.'
      : `Delete game session for team "${teamName || 'Unassigned'}"? This will reset the simulation state so the team can start fresh.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/teams?id=${sessionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', isAll ? 'All game sessions removed' : 'Game session deleted successfully');
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to delete game session');
      }
    } catch (e) {
      showNotification('error', 'Error deleting game session');
    }
  };

  // -------------------------------------------------------------
  // TEAM HANDLERS
  // -------------------------------------------------------------
  const openCreateTeam = () => {
    setTeamForm({ name: '' });
    setTeamModal({ open: true, mode: 'create' });
  };

  const openEditTeam = (team: any) => {
    setTeamForm({ name: team.name });
    setTeamModal({ open: true, mode: 'edit', team });
  };

  const handleSaveTeam = async () => {
    if (!teamForm.name.trim()) {
      showNotification('error', 'Team name cannot be empty');
      return;
    }
    try {
      const method = teamModal.mode === 'create' ? 'POST' : 'PUT';
      const body = teamModal.mode === 'create' 
        ? { name: teamForm.name.trim() } 
        : { _id: teamModal.team._id, name: teamForm.name.trim() };

      const res = await fetch('/api/admin/manage-teams', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', teamModal.mode === 'create' ? 'Team established successfully' : 'Team updated');
        setTeamModal({ open: false, mode: 'create' });
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to save team');
      }
    } catch (e) {
      showNotification('error', 'Network error saving team');
    }
  };

  const handleDeleteTeam = async (team: any) => {
    const playerCount = team.players?.length || 0;
    const confirmMsg = playerCount > 0
      ? `Delete team "${team.name}" and all ${playerCount} assigned players? This action cannot be reversed.`
      : `Are you sure you want to delete team "${team.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/manage-teams?id=${team._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Team and members deleted');
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to delete team');
      }
    } catch (e) {
      showNotification('error', 'Error deleting team');
    }
  };

  // -------------------------------------------------------------
  // PLAYER HANDLERS (Must have a team)
  // -------------------------------------------------------------
  const openAddPlayer = (teamId: string) => {
    setPlayerForm({ name: '', email: '', password: '', teamId });
    setPlayerModal({ open: true, mode: 'create', teamId });
  };

  const openEditPlayer = (player: any) => {
    setPlayerForm({ 
      name: player.name, 
      email: player.email, 
      password: '', 
      teamId: typeof player.teamId === 'object' ? player.teamId?._id : player.teamId 
    });
    setPlayerModal({ open: true, mode: 'edit', player });
  };

  const handleSavePlayer = async () => {
    if (!playerForm.name.trim() || !playerForm.email.trim()) {
      showNotification('error', 'Player name and email are required');
      return;
    }
    if (playerModal.mode === 'create' && !playerForm.password) {
      showNotification('error', 'Password is required for new player accounts');
      return;
    }
    if (!playerForm.teamId) {
      showNotification('error', 'Players must be assigned to an existing team');
      return;
    }

    try {
      const method = playerModal.mode === 'create' ? 'POST' : 'PUT';
      const body: any = {
        name: playerForm.name.trim(),
        email: playerForm.email.trim(),
        role: 'player',
        teamId: playerForm.teamId
      };
      if (playerModal.mode === 'edit') {
        body._id = playerModal.player._id;
        if (playerForm.password.trim()) body.password = playerForm.password.trim();
      } else {
        body.password = playerForm.password.trim();
      }

      const res = await fetch('/api/admin/manage-users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', playerModal.mode === 'create' ? 'Player assigned to team' : 'Player profile updated');
        setPlayerModal({ open: false, mode: 'create' });
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to save player');
      }
    } catch (e) {
      showNotification('error', 'Error saving player');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/manage-users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'User removed');
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to delete user');
      }
    } catch (e) {
      showNotification('error', 'Error deleting user');
    }
  };

  // -------------------------------------------------------------
  // ADMIN ACCOUNT HANDLERS (No team required)
  // -------------------------------------------------------------
  const openAddAdmin = () => {
    setAdminForm({ name: '', email: '', password: '' });
    setAdminModal({ open: true, mode: 'create' });
  };

  const openEditAdmin = (adminUser: any) => {
    setAdminForm({ name: adminUser.name, email: adminUser.email, password: '' });
    setAdminModal({ open: true, mode: 'edit', adminUser });
  };

  const handleSaveAdmin = async () => {
    if (!adminForm.name.trim() || !adminForm.email.trim()) {
      showNotification('error', 'Admin name and email are required');
      return;
    }
    if (adminModal.mode === 'create' && !adminForm.password) {
      showNotification('error', 'Password is required for new administrator accounts');
      return;
    }

    try {
      const method = adminModal.mode === 'create' ? 'POST' : 'PUT';
      const body: any = {
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        role: 'admin',
        teamId: null // Admin does not need a team
      };
      if (adminModal.mode === 'edit') {
        body._id = adminModal.adminUser._id;
        if (adminForm.password.trim()) body.password = adminForm.password.trim();
      } else {
        body.password = adminForm.password.trim();
      }

      const res = await fetch('/api/admin/manage-users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', adminModal.mode === 'create' ? 'Administrator account created' : 'Admin updated');
        setAdminModal({ open: false, mode: 'create' });
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to save admin');
      }
    } catch (e) {
      showNotification('error', 'Error saving admin account');
    }
  };

  // -------------------------------------------------------------
  // SCENARIO HANDLERS
  // -------------------------------------------------------------
  const openCreateScenario = () => {
    const nextDay = scenarios.length * 2;
    setScenarioForm({ 
      scenarioId: `scenario_day_${nextDay}`, 
      title: '', 
      situation: '', 
      day: nextDay 
    });
    setScenarioModal({ open: true, mode: 'create' });
  };

  const openEditScenario = (s: any) => {
    setScenarioForm({
      scenarioId: s.scenarioId,
      title: s.title,
      situation: s.situation,
      day: s.conditions?.find((c: any) => c.field === 'day')?.value ?? 0
    });
    setScenarioModal({ open: true, mode: 'edit', scenario: s });
  };

  const handleSaveScenario = async () => {
    if (!scenarioForm.scenarioId.trim() || !scenarioForm.title.trim() || !scenarioForm.situation.trim()) {
      showNotification('error', 'Scenario ID, Title, and Situation Briefing are required');
      return;
    }

    try {
      const method = scenarioModal.mode === 'create' ? 'POST' : 'PUT';
      const body: any = {
        scenarioId: scenarioForm.scenarioId.trim(),
        title: scenarioForm.title.trim(),
        situation: scenarioForm.situation.trim(),
        day: Number(scenarioForm.day) || 0,
        priority: 100 - (Number(scenarioForm.day) || 0) * 10
      };
      if (scenarioModal.mode === 'edit') {
        body._id = scenarioModal.scenario._id;
      }

      const res = await fetch('/api/admin/manage-scenarios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', scenarioModal.mode === 'create' ? 'Scenario created. Now assign actions to it.' : 'Scenario updated');
        setScenarioModal({ open: false, mode: 'create' });
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to save scenario');
      }
    } catch (e) {
      showNotification('error', 'Error saving scenario');
    }
  };

  const handleDeleteScenario = async (s: any) => {
    if (!confirm(`Delete scenario "${s.title}" and its associated actions?`)) return;
    try {
      const res = await fetch(`/api/admin/manage-scenarios?id=${s._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Scenario and actions removed');
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to delete scenario');
      }
    } catch (e) {
      showNotification('error', 'Error deleting scenario');
    }
  };

  // -------------------------------------------------------------
  // ACTIONS HANDLERS (Must have a scenario)
  // -------------------------------------------------------------
  const openAddActionForScenario = (scenario: any) => {
    setActionSourceMode('dropdown');
    setSelectedDropdownActionId('');
    const bucketNum = Math.floor((scenario.conditions?.find((c: any) => c.field === 'day')?.value ?? 0) / 2) + 1;
    const actionCount = (scenario.actions?.length || 0) + 1;
    setNewActionForm({
      actionId: `B${bucketNum}_ACT_${actionCount}`,
      title: '',
      description: '',
      floodPreparedness: 0,
      droughtPreparedness: 0,
      emergencyBudget: 0,
      communityTrust: 0,
      informationQuality: 0
    });
    setAddActionModal({ open: true, scenario });
  };

  const handleAttachExistingAction = async () => {
    if (!selectedDropdownActionId) {
      showNotification('error', 'Select an action from the dropdown first');
      return;
    }
    const scen = addActionModal.scenario;
    const currentActionIds = scen.availableActionIds || [];
    if (currentActionIds.includes(selectedDropdownActionId)) {
      showNotification('error', 'This action is already attached to this scenario');
      return;
    }

    try {
      // 1. Update Scenario's availableActionIds
      const updatedIds = [...currentActionIds, selectedDropdownActionId];
      const resScen = await fetch('/api/admin/manage-scenarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: scen._id, availableActionIds: updatedIds })
      });
      // 2. Set action's scenarioId to this scenario
      const selectedActionObj = allActions.find(a => a.actionId === selectedDropdownActionId);
      if (selectedActionObj) {
        await fetch('/api/admin/manage-actions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: selectedActionObj._id, scenarioId: scen.scenarioId })
        });
      }

      const data = await resScen.json();
      if (data.success) {
        showNotification('success', 'Action attached to scenario');
        setAddActionModal({ open: false });
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to attach action');
      }
    } catch (e) {
      showNotification('error', 'Error attaching action');
    }
  };

  const handleCreateNewActionForScenario = async () => {
    if (!newActionForm.title.trim()) {
      showNotification('error', 'Action title is required');
      return;
    }
    const scen = addActionModal.scenario;

    try {
      const body = {
        actionId: newActionForm.actionId.trim() || `${scen.scenarioId}_ACT_${Date.now().toString().slice(-4)}`,
        scenarioId: scen.scenarioId, // Mandatory scenario association
        title: newActionForm.title.trim(),
        description: newActionForm.description.trim(),
        baseImpacts: {
          floodPreparedness: Number(newActionForm.floodPreparedness) || 0,
          droughtPreparedness: Number(newActionForm.droughtPreparedness) || 0,
          emergencyBudget: Number(newActionForm.emergencyBudget) || 0,
          communityTrust: Number(newActionForm.communityTrust) || 0,
          informationQuality: Number(newActionForm.informationQuality) || 0,
        }
      };

      const res = await fetch('/api/admin/manage-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Action created and attached to scenario');
        setAddActionModal({ open: false });
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to create action');
      }
    } catch (e) {
      showNotification('error', 'Error creating action');
    }
  };

  const openEditAction = (action: any) => {
    setNewActionForm({
      actionId: action.actionId,
      title: action.title,
      description: action.description || '',
      floodPreparedness: action.baseImpacts?.floodPreparedness || 0,
      droughtPreparedness: action.baseImpacts?.droughtPreparedness || 0,
      emergencyBudget: action.baseImpacts?.emergencyBudget || 0,
      communityTrust: action.baseImpacts?.communityTrust || 0,
      informationQuality: action.baseImpacts?.informationQuality || 0,
    });
    setEditActionModal({ open: true, action });
  };

  const handleSaveEditedAction = async () => {
    if (!newActionForm.title.trim()) {
      showNotification('error', 'Action title is required');
      return;
    }
    try {
      const body = {
        _id: editActionModal.action._id,
        title: newActionForm.title.trim(),
        description: newActionForm.description.trim(),
        baseImpacts: {
          floodPreparedness: Number(newActionForm.floodPreparedness) || 0,
          droughtPreparedness: Number(newActionForm.droughtPreparedness) || 0,
          emergencyBudget: Number(newActionForm.emergencyBudget) || 0,
          communityTrust: Number(newActionForm.communityTrust) || 0,
          informationQuality: Number(newActionForm.informationQuality) || 0,
        }
      };

      const res = await fetch('/api/admin/manage-actions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Action impacts updated');
        setEditActionModal({ open: false });
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to update action');
      }
    } catch (e) {
      showNotification('error', 'Error updating action');
    }
  };

  const handleRemoveActionFromScenario = async (scen: any, actionIdToRemove: string) => {
    if (!confirm('Remove this action from the scenario?')) return;
    try {
      const updatedIds = (scen.availableActionIds || []).filter((id: string) => id !== actionIdToRemove);
      const res = await fetch('/api/admin/manage-scenarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: scen._id, availableActionIds: updatedIds })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Action detached from scenario');
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to remove action');
      }
    } catch (e) {
      showNotification('error', 'Error detaching action');
    }
  };

  const handleReorderAction = async (scen: any, index: number, direction: 'up' | 'down') => {
    const currentIds = [...(scen.availableActionIds || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentIds.length) return;

    // Swap
    const temp = currentIds[index];
    currentIds[index] = currentIds[targetIndex];
    currentIds[targetIndex] = temp;

    try {
      const res = await fetch('/api/admin/manage-scenarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: scen._id, availableActionIds: currentIds })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Nav structure
  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Telemetry Overview' },
    { id: 'teams', icon: Users, label: 'Teams & Players' },
    { id: 'scenarios', icon: FileText, label: 'Scenarios & Actions' },
  ];

  const adminUsersList = allUsers.filter(u => u.role === 'admin');

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 font-sans flex relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
      
      {/* Notifications Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-xl shadow-2xl font-mono text-sm ${
              notification.type === 'success' 
                ? 'bg-green-950/80 border-green-500/50 text-green-300' 
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="relative z-20 w-64 border-r border-blue-900/40 bg-black/70 backdrop-blur-2xl flex flex-col">
        <div className="p-6 border-b border-blue-900/40">
          <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.25)] mb-4">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-lg font-black tracking-widest uppercase text-white">Central Command</h1>
          <p className="text-xs font-mono text-blue-400/80 mt-0.5">Disaster Management Admin</p>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-2 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setSearchTerm(''); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs tracking-wider uppercase transition-all ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                }`}
              >
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-blue-900/40">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800/40 rounded-xl transition-colors font-mono text-xs font-bold tracking-wider uppercase"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Command Console */}
      <div className="flex-1 relative z-10 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-blue-900/40">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-blue-900/40 pb-6">
          <div>
            <h2 className="text-2xl font-black tracking-widest uppercase text-white flex items-center gap-3">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-xs font-mono text-gray-400 mt-1">
              {activeTab === 'overview' && 'Live sector monitoring, team decision pipelines, and telemetry'}
              {activeTab === 'teams' && 'Create teams, manage player rosters, and configure administrative access'}
              {activeTab === 'scenarios' && 'Manage simulation operational buckets and link actionable decision cards'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'overview' && sessions.length > 0 && (
              <button 
                onClick={() => handleDeleteSession('all')}
                className="flex items-center gap-2 px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded-xl transition-all font-mono text-xs"
                title="Erase all active & completed sessions to reset all teams"
              >
                <Trash2 size={14} /> Clear All Sessions
              </button>
            )}
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-700/40 rounded-xl transition-all font-mono text-xs"
            >
              <RefreshCcw size={15} className={loading ? "animate-spin" : ""} /> Sync State
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* TAB 1: TELEMETRY OVERVIEW                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="grid gap-6">
            {sessions.length === 0 && !loading && (
              <div className="text-center p-16 border border-dashed border-blue-900/40 rounded-2xl text-gray-500 font-mono text-sm">
                NO ACTIVE SESSIONS REGISTERED IN SECTOR
              </div>
            )}
            
            {sessions.map((session, i) => {
              const team = session.teamId;
              const state = session.state;
              const isCompleted = session.status === 'COMPLETED';
              
              return (
                <motion.div 
                  key={session._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-6 rounded-2xl border backdrop-blur-md flex flex-col ${
                    isCompleted 
                      ? 'border-green-500/40 bg-green-950/10' 
                      : 'border-blue-500/30 bg-blue-950/10 hover:border-blue-500/50'
                  }`}
                >
                  <div 
                    className="flex items-center justify-between w-full cursor-pointer select-none"
                    onClick={() => setExpandedSessions(prev => ({ ...prev, [session._id]: !prev[session._id] }))}
                  >
                    <div className="flex flex-col gap-1 w-1/2">
                      <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">{team?.name || 'Unassigned Team'}</span>
                      <span className="text-xl font-black text-white">{session.currentUserId?.name || 'Session Commander'}</span>
                      <div className="mt-2">
                        {isCompleted ? (
                          <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded-md text-xs font-black tracking-widest uppercase">
                            Mission Accomplished // CPS: {typeof session.finalResult?.cps === 'number' ? session.finalResult.cps.toFixed(1) : 'Complete'}
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-md text-xs font-black tracking-widest uppercase animate-pulse">
                            Day {state?.day ?? 0} (Bucket {state?.bucket ?? 1} / 6)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <span className="text-gray-400 text-xs font-mono uppercase">Information</span>
                        <div className="text-xl font-black text-blue-400">
                          {Math.round(state?.information?.informationQuality || 50)}%
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session._id, team?.name);
                        }}
                        className="w-9 h-9 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 hover:border-red-600/60 flex items-center justify-center transition-all"
                        title="Delete this game session (reset team progress)"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center text-blue-400 border border-blue-800/40">
                        {expandedSessions[session._id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {expandedSessions[session._id] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-6 pt-6 border-t border-blue-900/40 flex flex-col gap-6"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/40 p-4 rounded-xl border border-blue-900/30">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-gray-400 text-xs font-mono">WATER CAPACITY</span>
                          <div className="flex items-center gap-2 text-blue-400 font-black text-lg">
                            <Droplets size={18} /> {Math.round(state?.resources?.drinkingWater ?? 100)}%
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-gray-400 text-xs font-mono">EMERGENCY BUDGET</span>
                          <div className="flex items-center gap-2 text-green-400 font-black text-lg">
                            <Coins size={18} /> LKR {Math.round(state?.resources?.emergencyBudget ?? 500)}M
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-gray-400 text-xs font-mono">FLOOD PREPAREDNESS</span>
                          <div className="flex items-center gap-2 text-cyan-400 font-black text-lg">
                            {Math.round(state?.scores?.floodPreparedness ?? 50)}%
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-gray-400 text-xs font-mono">COMMUNITY TRUST</span>
                          <div className="flex items-center gap-2 text-purple-400 font-black text-lg">
                            {Math.round(state?.community?.communityTrust ?? 50)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session._id, team?.name);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/70 text-red-300 border border-red-800/50 text-xs font-mono font-bold transition-all"
                        >
                          <Trash2 size={14} /> Delete Session &amp; Reset Team
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TEAMS & PLAYERS (Unified page, Players must have a team)          */}
        {/* ========================================================================= */}
        {activeTab === 'teams' && (
          <div className="space-y-8">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-950/20 p-4 rounded-2xl border border-blue-900/40">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filter teams or players..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-black/50 text-white rounded-xl border border-blue-900/50 focus:border-blue-500 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={openCreateTeam}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  <Plus size={16} /> Create Team
                </button>
              </div>
            </div>

            {/* Teams Roster List */}
            <div className="grid gap-6">
              {teams.length === 0 && !loading && (
                <div className="text-center p-16 border border-dashed border-blue-900/40 rounded-2xl text-gray-500 font-mono text-sm">
                  No teams established yet. Click &quot;Create Team&quot; to form the first operational unit.
                </div>
              )}

              {teams
                .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (t.players && t.players.some((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase()))))
                .map((team) => {
                  const teamPlayers = team.players || [];
                  const isExpanded = expandedTeams[team._id] ?? true;

                  return (
                    <motion.div 
                      key={team._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/40 border border-blue-900/40 rounded-2xl overflow-hidden backdrop-blur-md shadow-lg"
                    >
                      {/* Team Header */}
                      <div className="p-5 bg-gradient-to-r from-blue-950/40 to-transparent border-b border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setExpandedTeams(prev => ({ ...prev, [team._id]: !prev[team._id] }))}
                            className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center text-blue-400 hover:bg-blue-800/40 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-black text-white uppercase tracking-wider">{team.name}</h3>
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold">
                                {teamPlayers.length} {teamPlayers.length === 1 ? 'Player' : 'Players'}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-gray-500 mt-0.5">ID: {team._id}</p>
                          </div>
                        </div>

                        {/* Team Actions */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openAddPlayer(team._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg font-mono text-xs font-bold transition-all"
                          >
                            <UserPlus size={14} /> Add Player
                          </button>
                          <button 
                            onClick={() => openEditTeam(team)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700/40 rounded-lg font-mono text-xs transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeam(team)}
                            className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800/40 rounded-lg font-mono text-xs transition-all"
                            title="Delete Team & Associated Players"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Players Sub-Table */}
                      {isExpanded && (
                        <div className="p-5">
                          {teamPlayers.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl bg-black/20">
                              <p className="text-gray-500 font-mono text-xs">No players assigned to {team.name} yet.</p>
                              <button 
                                onClick={() => openAddPlayer(team._id)}
                                className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/40 rounded-lg font-mono text-xs hover:bg-blue-600/30 transition-all"
                              >
                                <UserPlus size={14} /> Add First Player
                              </button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left font-mono text-xs">
                                <thead>
                                  <tr className="border-b border-gray-800 text-gray-400">
                                    <th className="pb-3 font-semibold">Player Name</th>
                                    <th className="pb-3 font-semibold">Login Email</th>
                                    <th className="pb-3 font-semibold">Role</th>
                                    <th className="pb-3 text-right font-semibold">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-900">
                                  {teamPlayers.map((player: any) => (
                                    <tr key={player._id} className="hover:bg-white/5 transition-colors">
                                      <td className="py-3 font-bold text-gray-200 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        {player.name}
                                      </td>
                                      <td className="py-3 text-blue-400/90">{player.email}</td>
                                      <td className="py-3">
                                        <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800/40 text-[10px] uppercase font-bold">
                                          Player
                                        </span>
                                      </td>
                                      <td className="py-3 text-right">
                                        <div className="inline-flex items-center gap-2">
                                          <button 
                                            onClick={() => openEditPlayer(player)}
                                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-gray-800 transition-colors"
                                            title="Edit Player"
                                          >
                                            Edit
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteUser(player._id, player.name)}
                                            className="px-2.5 py-1 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded border border-red-800/30 transition-colors"
                                            title="Remove Player"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </div>

            {/* Administrators Section (No team needed) */}
            <div className="mt-12 pt-8 border-t border-blue-900/40">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
                    <ShieldCheck size={22} className="text-yellow-500" />
                    System Administrators
                  </h3>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    Admin accounts operate across all teams and sectors (no team assignment needed).
                  </p>
                </div>
                <button 
                  onClick={openAddAdmin}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/40 font-mono text-xs font-bold rounded-xl transition-all"
                >
                  <Plus size={15} /> Add Administrator
                </button>
              </div>

              <div className="bg-black/40 border border-yellow-900/30 rounded-2xl overflow-hidden backdrop-blur-md">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="bg-yellow-950/20 border-b border-yellow-900/30 text-yellow-400/80">
                      <th className="p-4 font-semibold">Admin Name</th>
                      <th className="p-4 font-semibold">Email</th>
                      <th className="p-4 font-semibold">Access Level</th>
                      <th className="p-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {adminUsersList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500 font-mono">No administrators registered.</td>
                      </tr>
                    ) : (
                      adminUsersList.map(admin => (
                        <tr key={admin._id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-bold text-gray-200">{admin.name}</td>
                          <td className="p-4 text-yellow-400/90">{admin.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[10px] uppercase font-bold">
                              Full Administrator
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button 
                                onClick={() => openEditAdmin(admin)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-gray-800 transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(admin._id, admin.name)}
                                className="px-2.5 py-1 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded border border-red-800/30 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SCENARIOS & ACTIONS (Unified page, Actions must have scenario)     */}
        {/* ========================================================================= */}
        {activeTab === 'scenarios' && (
          <div className="space-y-8">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-950/20 p-4 rounded-2xl border border-blue-900/40">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filter scenarios or actions..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-black/50 text-white rounded-xl border border-blue-900/50 focus:border-blue-500 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={openCreateScenario}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  <Plus size={16} /> Create Scenario
                </button>
              </div>
            </div>

            {/* Scenarios List */}
            <div className="grid gap-8">
              {scenarios.length === 0 && !loading && (
                <div className="text-center p-16 border border-dashed border-blue-900/40 rounded-2xl text-gray-500 font-mono text-sm">
                  No scenarios defined. Click &quot;Create Scenario&quot; to begin building your simulation.
                </div>
              )}

              {scenarios
                .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  s.scenarioId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (s.actions && s.actions.some((a: any) => a.title.toLowerCase().includes(searchTerm.toLowerCase()))))
                .map((scenario) => {
                  const scenActions = scenario.actions || [];
                  const scenarioDay = scenario.conditions?.find((c: any) => c.field === 'day')?.value ?? 0;

                  return (
                    <motion.div 
                      key={scenario._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/40 border border-blue-900/40 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl"
                    >
                      {/* Scenario Header */}
                      <div className="p-6 bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-transparent border-b border-blue-900/40 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5 max-w-3xl">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/40 text-xs font-mono font-black uppercase tracking-wider">
                              Day {scenarioDay} // {scenario.scenarioId}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
                              {scenActions.length} Assigned Actions
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-white uppercase tracking-wide">{scenario.title}</h3>
                          <p className="text-xs font-mono text-gray-400 leading-relaxed pt-1">
                            {scenario.situation}
                          </p>
                        </div>

                        {/* Scenario Controls */}
                        <div className="flex items-center gap-2 self-start md:self-auto">
                          <button 
                            onClick={() => openAddActionForScenario(scenario)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl font-mono text-xs font-bold transition-all shadow-sm"
                          >
                            <Plus size={15} /> Add Action
                          </button>
                          <button 
                            onClick={() => openEditScenario(scenario)}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700/40 rounded-xl font-mono text-xs transition-all"
                            title="Edit Scenario Details"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteScenario(scenario)}
                            className="px-3 py-2 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800/40 rounded-xl font-mono text-xs transition-all"
                            title="Delete Scenario & Actions"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Scenario Actions Container */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-bold flex items-center gap-2">
                            <Layers size={14} /> Action Choices for this Scenario (Priority Ranked 1 - {scenActions.length})
                          </h4>
                        </div>

                        {scenActions.length === 0 ? (
                          <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-black/20">
                            <p className="text-gray-500 font-mono text-xs">No actions attached to this scenario.</p>
                            <p className="text-gray-600 font-mono text-[11px] mt-1">Actions must have a scenario. Attach existing actions or create new ones below.</p>
                            <button 
                              onClick={() => openAddActionForScenario(scenario)}
                              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/40 rounded-xl font-mono text-xs hover:bg-blue-600/30 transition-all"
                            >
                              <Plus size={15} /> Add Actions to this Scenario
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {scenActions.map((action: any, idx: number) => {
                              const impacts = action.baseImpacts || {};

                              return (
                                <div 
                                  key={action._id || action.actionId || idx}
                                  className="p-4 bg-black/50 border border-gray-800/80 hover:border-blue-900/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                                >
                                  {/* Left: Priority & Description */}
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center font-mono text-xs font-black text-blue-400 shrink-0 mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-blue-300">{action.actionId}</span>
                                        <span className="font-mono text-xs font-bold text-white uppercase">{action.title}</span>
                                      </div>
                                      <p className="font-mono text-xs text-gray-400 leading-relaxed max-w-2xl">
                                        {action.description}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Middle: Impact Badges */}
                                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                    {impacts.floodPreparedness !== 0 && (
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                        (impacts.floodPreparedness || 0) > 0 ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'bg-red-950/60 text-red-400 border border-red-800/40'
                                      }`}>
                                        Flood {(impacts.floodPreparedness || 0) > 0 ? `+${impacts.floodPreparedness}` : impacts.floodPreparedness}%
                                      </span>
                                    )}
                                    {impacts.droughtPreparedness !== 0 && (
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                        (impacts.droughtPreparedness || 0) > 0 ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40' : 'bg-red-950/60 text-red-400 border border-red-800/40'
                                      }`}>
                                        Drought {(impacts.droughtPreparedness || 0) > 0 ? `+${impacts.droughtPreparedness}` : impacts.droughtPreparedness}%
                                      </span>
                                    )}
                                    {impacts.emergencyBudget !== 0 && (
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                        (impacts.emergencyBudget || 0) >= 0 ? 'bg-green-950/60 text-green-400 border border-green-800/40' : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                                      }`}>
                                        Budget {(impacts.emergencyBudget || 0) > 0 ? `+${impacts.emergencyBudget}` : impacts.emergencyBudget}M
                                      </span>
                                    )}
                                    {impacts.communityTrust !== 0 && (
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                        (impacts.communityTrust || 0) > 0 ? 'bg-purple-950/60 text-purple-400 border border-purple-800/40' : 'bg-red-950/60 text-red-400 border border-red-800/40'
                                      }`}>
                                        Trust {(impacts.communityTrust || 0) > 0 ? `+${impacts.communityTrust}` : impacts.communityTrust}%
                                      </span>
                                    )}
                                    {impacts.informationQuality !== 0 && (
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                        (impacts.informationQuality || 0) > 0 ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40' : 'bg-red-950/60 text-red-400 border border-red-800/40'
                                      }`}>
                                        Intel {(impacts.informationQuality || 0) > 0 ? `+${impacts.informationQuality}` : impacts.informationQuality}%
                                      </span>
                                    )}
                                  </div>

                                  {/* Right: Actions & Reordering */}
                                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                                    <button 
                                      onClick={() => handleReorderAction(scenario, idx, 'up')}
                                      disabled={idx === 0}
                                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                                      title="Move Up in Priority"
                                    >
                                      <ArrowUp size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleReorderAction(scenario, idx, 'down')}
                                      disabled={idx === scenActions.length - 1}
                                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                                      title="Move Down in Priority"
                                    >
                                      <ArrowDown size={14} />
                                    </button>
                                    <button 
                                      onClick={() => openEditAction(action)}
                                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-gray-800 text-xs font-mono"
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveActionFromScenario(scenario, action.actionId)}
                                      className="px-2 py-1 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded border border-red-800/30 text-xs font-mono"
                                      title="Remove from Scenario"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT TEAM                                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {teamModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#030914] border border-blue-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-blue-900/40 pb-4">
                <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Users size={18} className="text-blue-400" />
                  {teamModal.mode === 'create' ? 'Create Team' : 'Edit Team'}
                </h3>
                <button onClick={() => setTeamModal({ open: false, mode: 'create' })} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-mono text-blue-300 uppercase mb-2">Team Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Team Alpha"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ name: e.target.value })}
                  className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none"
                  autoFocus
                />
                <p className="text-[11px] font-mono text-gray-500 mt-2">
                  Once created, you can recruit players into this team.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-blue-900/40">
                <button 
                  onClick={() => setTeamModal({ open: false, mode: 'create' })}
                  className="px-4 py-2 font-mono text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTeam}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all"
                >
                  {teamModal.mode === 'create' ? 'Create Team' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT PLAYER (Players MUST have a team)                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {playerModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#030914] border border-blue-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-blue-900/40 pb-4">
                <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <UserPlus size={18} className="text-blue-400" />
                  {playerModal.mode === 'create' ? 'Add Player to Team' : 'Edit Player'}
                </h3>
                <button onClick={() => setPlayerModal({ open: false, mode: 'create' })} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Assigned Team (Mandatory)</label>
                  <select 
                    value={playerForm.teamId}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, teamId: e.target.value }))}
                    className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none"
                  >
                    <option value="">Select an existing Team...</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] font-mono text-gray-500 mt-1">Players cannot exist without a team.</p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Player Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Commander Sarah"
                    value={playerForm.name}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Email Address</label>
                  <input 
                    type="email"
                    placeholder="player@sustaintech.online"
                    value={playerForm.email}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">
                    {playerModal.mode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}
                  </label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={playerForm.password}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-blue-900/40">
                <button 
                  onClick={() => setPlayerModal({ open: false, mode: 'create' })}
                  className="px-4 py-2 font-mono text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePlayer}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all"
                >
                  {playerModal.mode === 'create' ? 'Save Player' : 'Update Profile'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT ADMIN (Admins do not need a team)                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {adminModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#030914] border border-yellow-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-yellow-900/40 pb-4">
                <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <ShieldCheck size={18} className="text-yellow-400" />
                  {adminModal.mode === 'create' ? 'Add Administrator' : 'Edit Administrator'}
                </h3>
                <button onClick={() => setAdminModal({ open: false, mode: 'create' })} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-yellow-950/20 border border-yellow-800/40 rounded-xl text-yellow-300 font-mono text-xs flex items-center gap-2">
                  <Info size={16} className="shrink-0" />
                  Administrator accounts possess full access across all operations and do not require a team assignment.
                </div>

                <div>
                  <label className="block text-xs font-mono text-yellow-300 uppercase mb-1.5">Admin Full Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Chief Controller"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black/50 text-white p-3 rounded-xl border border-yellow-900/60 focus:border-yellow-500 font-mono text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-yellow-300 uppercase mb-1.5">Admin Email</label>
                  <input 
                    type="email"
                    placeholder="admin@sustaintech.online"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-black/50 text-white p-3 rounded-xl border border-yellow-900/60 focus:border-yellow-500 font-mono text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-yellow-300 uppercase mb-1.5">
                    {adminModal.mode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}
                  </label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-black/50 text-white p-3 rounded-xl border border-yellow-900/60 focus:border-yellow-500 font-mono text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-yellow-900/40">
                <button 
                  onClick={() => setAdminModal({ open: false, mode: 'create' })}
                  className="px-4 py-2 font-mono text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAdmin}
                  className="px-5 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-mono text-xs font-bold rounded-xl transition-all"
                >
                  {adminModal.mode === 'create' ? 'Create Admin Account' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE / EDIT SCENARIO                                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {scenarioModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#030914] border border-blue-500/40 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-blue-900/40 pb-4">
                <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <FileText size={18} className="text-blue-400" />
                  {scenarioModal.mode === 'create' ? 'Create Simulation Scenario' : 'Edit Scenario'}
                </h3>
                <button onClick={() => setScenarioModal({ open: false, mode: 'create' })} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Scenario ID</label>
                    <input 
                      type="text"
                      placeholder="e.g. scenario_day_0"
                      value={scenarioForm.scenarioId}
                      disabled={scenarioModal.mode === 'edit'}
                      onChange={(e) => setScenarioForm(prev => ({ ...prev, scenarioId: e.target.value }))}
                      className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Timeline Day</label>
                    <input 
                      type="number"
                      placeholder="e.g. 0"
                      value={scenarioForm.day}
                      onChange={(e) => setScenarioForm(prev => ({ ...prev, day: Number(e.target.value) || 0 }))}
                      className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Scenario Title</label>
                  <input 
                    type="text"
                    placeholder="e.g. Initial Warning - Pre-Event Readiness"
                    value={scenarioForm.title}
                    onChange={(e) => setScenarioForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Situation Briefing</label>
                  <textarea 
                    rows={4}
                    placeholder="Detailed tactical situation summary shown to players..."
                    value={scenarioForm.situation}
                    onChange={(e) => setScenarioForm(prev => ({ ...prev, situation: e.target.value }))}
                    className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-blue-900/40">
                <button 
                  onClick={() => setScenarioModal({ open: false, mode: 'create' })}
                  className="px-4 py-2 font-mono text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveScenario}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all"
                >
                  {scenarioModal.mode === 'create' ? 'Create Scenario' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 5: ADD ACTION TO SCENARIO (Dropdown OR Create in place)             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {addActionModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#030914] border border-blue-500/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-blue-900/40 pb-4">
                <div>
                  <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Database size={18} className="text-blue-400" />
                    Add Action to {addActionModal.scenario?.title}
                  </h3>
                  <p className="text-xs font-mono text-blue-400/80 mt-0.5">Actions must be assigned directly to an operational scenario.</p>
                </div>
                <button onClick={() => setAddActionModal({ open: false })} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Selector Tabs: Dropdown vs Create New */}
              <div className="flex rounded-xl bg-black/50 p-1 border border-blue-900/40 font-mono text-xs">
                <button 
                  onClick={() => setActionSourceMode('dropdown')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    actionSourceMode === 'dropdown' 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Link2 size={14} /> Attach from Dropdown
                </button>
                <button 
                  onClick={() => setActionSourceMode('create')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    actionSourceMode === 'create' 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Plus size={14} /> Create New Action
                </button>
              </div>

              {/* MODE 1: DROPDOWN ATTACH */}
              {actionSourceMode === 'dropdown' && (
                <div className="space-y-4 py-2">
                  <div>
                    <label className="block text-xs font-mono text-blue-300 uppercase mb-2">Select Action to Attach</label>
                    <select 
                      value={selectedDropdownActionId}
                      onChange={(e) => setSelectedDropdownActionId(e.target.value)}
                      className="w-full bg-black/50 text-white p-3 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-sm focus:outline-none"
                    >
                      <option value="">-- Choose an action from database --</option>
                      {allActions
                        .filter(a => !(addActionModal.scenario?.availableActionIds || []).includes(a.actionId))
                        .map(a => (
                          <option key={a.actionId} value={a.actionId}>
                            [{a.actionId}] {a.title}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Preview of selected action */}
                  {selectedDropdownActionId && (
                    <div className="p-4 bg-blue-950/20 rounded-xl border border-blue-800/40 font-mono text-xs space-y-2">
                      {(() => {
                        const act = allActions.find(a => a.actionId === selectedDropdownActionId);
                        if (!act) return null;
                        return (
                          <>
                            <div className="font-bold text-white uppercase">{act.title}</div>
                            <p className="text-gray-400">{act.description}</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                                Flood: {act.baseImpacts?.floodPreparedness || 0}%
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                                Drought: {act.baseImpacts?.droughtPreparedness || 0}%
                              </span>
                              <span className="px-2 py-0.5 rounded bg-green-950/60 text-green-400 border border-green-800/40">
                                Budget: {act.baseImpacts?.emergencyBudget || 0}M
                              </span>
                              <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
                                Trust: {act.baseImpacts?.communityTrust || 0}%
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-blue-900/40">
                    <button 
                      onClick={() => setAddActionModal({ open: false })}
                      className="px-4 py-2 font-mono text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAttachExistingAction}
                      disabled={!selectedDropdownActionId}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-mono text-xs font-bold rounded-xl transition-all"
                    >
                      Attach to Scenario
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: CREATE NEW ACTION */}
              {actionSourceMode === 'create' && (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Action ID (Code)</label>
                      <input 
                        type="text"
                        placeholder="e.g. B1_ACT_1"
                        value={newActionForm.actionId}
                        onChange={(e) => setNewActionForm(prev => ({ ...prev, actionId: e.target.value }))}
                        className="w-full bg-black/50 text-white p-2.5 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Action Title</label>
                      <input 
                        type="text"
                        placeholder="e.g. Deploy Rapid Canal Clearing"
                        value={newActionForm.title}
                        onChange={(e) => setNewActionForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-black/50 text-white p-2.5 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Description & Objective</label>
                    <textarea 
                      rows={2}
                      placeholder="Operational directives and resource deployments..."
                      value={newActionForm.description}
                      onChange={(e) => setNewActionForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-black/50 text-white p-2.5 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div className="p-4 bg-black/40 rounded-xl border border-blue-900/40 space-y-3">
                    <span className="block text-xs font-mono text-blue-400 uppercase font-bold">Base Value Impacts</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div>
                        <label className="block text-gray-400 mb-1">Flood Prep (+/- %)</label>
                        <input 
                          type="number"
                          value={newActionForm.floodPreparedness}
                          onChange={(e) => setNewActionForm(prev => ({ ...prev, floodPreparedness: Number(e.target.value) || 0 }))}
                          className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-cyan-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Drought Prep (+/- %)</label>
                        <input 
                          type="number"
                          value={newActionForm.droughtPreparedness}
                          onChange={(e) => setNewActionForm(prev => ({ ...prev, droughtPreparedness: Number(e.target.value) || 0 }))}
                          className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-blue-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Budget (LKR M, e.g. -20)</label>
                        <input 
                          type="number"
                          value={newActionForm.emergencyBudget}
                          onChange={(e) => setNewActionForm(prev => ({ ...prev, emergencyBudget: Number(e.target.value) || 0 }))}
                          className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-green-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Community Trust (+/- %)</label>
                        <input 
                          type="number"
                          value={newActionForm.communityTrust}
                          onChange={(e) => setNewActionForm(prev => ({ ...prev, communityTrust: Number(e.target.value) || 0 }))}
                          className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-purple-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Intel Quality (+/- %)</label>
                        <input 
                          type="number"
                          value={newActionForm.informationQuality}
                          onChange={(e) => setNewActionForm(prev => ({ ...prev, informationQuality: Number(e.target.value) || 0 }))}
                          className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-indigo-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-blue-900/40">
                    <button 
                      onClick={() => setAddActionModal({ open: false })}
                      className="px-4 py-2 font-mono text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateNewActionForScenario}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all"
                    >
                      Create & Attach Action
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT ACTION                                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editActionModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#030914] border border-blue-500/40 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-blue-900/40 pb-4">
                <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Edit3 size={18} className="text-blue-400" />
                  Edit Action [{newActionForm.actionId}]
                </h3>
                <button onClick={() => setEditActionModal({ open: false })} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Action Title</label>
                  <input 
                    type="text"
                    value={newActionForm.title}
                    onChange={(e) => setNewActionForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-black/50 text-white p-2.5 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Description</label>
                  <textarea 
                    rows={2}
                    value={newActionForm.description}
                    onChange={(e) => setNewActionForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-black/50 text-white p-2.5 rounded-xl border border-blue-900/60 focus:border-blue-500 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="p-4 bg-black/40 rounded-xl border border-blue-900/40 space-y-3">
                  <span className="block text-xs font-mono text-blue-400 uppercase font-bold">Base Value Impacts</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1">Flood Prep (+/- %)</label>
                      <input 
                        type="number"
                        value={newActionForm.floodPreparedness}
                        onChange={(e) => setNewActionForm(prev => ({ ...prev, floodPreparedness: Number(e.target.value) || 0 }))}
                        className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-cyan-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Drought Prep (+/- %)</label>
                      <input 
                        type="number"
                        value={newActionForm.droughtPreparedness}
                        onChange={(e) => setNewActionForm(prev => ({ ...prev, droughtPreparedness: Number(e.target.value) || 0 }))}
                        className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-blue-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Budget (LKR M)</label>
                      <input 
                        type="number"
                        value={newActionForm.emergencyBudget}
                        onChange={(e) => setNewActionForm(prev => ({ ...prev, emergencyBudget: Number(e.target.value) || 0 }))}
                        className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-green-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Community Trust (+/- %)</label>
                      <input 
                        type="number"
                        value={newActionForm.communityTrust}
                        onChange={(e) => setNewActionForm(prev => ({ ...prev, communityTrust: Number(e.target.value) || 0 }))}
                        className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-purple-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Intel Quality (+/- %)</label>
                      <input 
                        type="number"
                        value={newActionForm.informationQuality}
                        onChange={(e) => setNewActionForm(prev => ({ ...prev, informationQuality: Number(e.target.value) || 0 }))}
                        className="w-full bg-black/60 p-2 rounded-lg border border-gray-800 text-indigo-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-blue-900/40">
                <button 
                  onClick={() => setEditActionModal({ open: false })}
                  className="px-4 py-2 font-mono text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEditedAction}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
