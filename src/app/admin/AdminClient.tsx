'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Droplets, Coins, LogOut, RefreshCcw, ChevronDown, ChevronUp, Activity, Users, LayoutDashboard, Settings, FileText, Database, Plus, Trash, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

function DynamicFormEditor({ initialData, onSave, onCancel, type, teams }: { initialData: any, onSave: (data: any) => void, onCancel: () => void, type: string, teams?: any[] }) {
  const defaultSchemas: Record<string, any> = {
    teams: { name: '' },
    users: { email: '', password: '', name: '' },
    scenarios: { scenarioId: '', day: 1, title: '', situation: '', description: '', impacts: { floodPreparedness: 0, droughtPreparedness: 0, emergencyBudget: 0, communityTrust: 0, informationQuality: 0 } },
    actions: { actionId: '', title: '', description: '', baseImpacts: { floodPreparedness: 0, droughtPreparedness: 0, emergencyBudget: 0, communityTrust: 0, informationQuality: 0 }, contextMultipliers: [] }
  };

  const [formData, setFormData] = useState(() => {
    let data = initialData;
    if (Object.keys(initialData).length === 0 && defaultSchemas[type]) {
      data = JSON.parse(JSON.stringify(defaultSchemas[type]));
    }
    if (type === 'users' && data._id && !('password' in data)) {
      data = { ...data, password: '' };
    }
    return data;
  });

  const handleChange = (path: string[], value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const renderField = (key: string, value: any, path: string[]) => {
    // Hide internal fields completely for a cleaner UI
    if (['_id', '__v', 'passwordHash', 'createdAt', 'updatedAt', 'role'].includes(key)) {
      return null;
    }

    if (key === 'password') {
      return (
        <div key={path.join('.')} className="col-span-2 sm:col-span-1 mb-4">
          <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">New Password (leave blank to keep current)</label>
          <input 
            type="text" 
            value={value || ''} 
            onChange={(e) => handleChange(path, e.target.value)}
            className="w-full bg-black/40 text-blue-100 p-2.5 rounded-md border border-blue-800/50 focus:border-blue-500 focus:outline-none font-mono text-sm shadow-inner" 
          />
        </div>
      );
    }

    if (key === 'teamId' || key === 'team') {
      return (
        <div key={path.join('.')} className="col-span-2 sm:col-span-1 mb-4">
          <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">Team</label>
          <select 
            value={typeof value === 'object' ? value?._id || '' : value || ''}
            onChange={(e) => handleChange(path, e.target.value)}
            className="w-full bg-black/40 text-blue-100 p-2.5 rounded-md border border-blue-800/50 focus:border-blue-500 focus:outline-none font-mono text-sm shadow-inner"
          >
            <option value="">No Team</option>
            {teams?.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      );
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={path.join('.')} className="col-span-2 mb-6 mt-2 p-5 border border-blue-800/40 bg-blue-950/10 rounded-xl shadow-inner">
          <label className="block text-sm font-black tracking-wider text-blue-400 mb-4 uppercase flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(value).map(([subKey, subVal]) => renderField(subKey, subVal, [...path, subKey]))}
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={path.join('.')} className="col-span-2 mb-4">
          <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">{key.replace(/([A-Z])/g, ' $1').trim()} (JSON)</label>
          <textarea 
            value={JSON.stringify(value, null, 2)} 
            onChange={(e) => {
              try {
                handleChange(path, JSON.parse(e.target.value));
              } catch(e) {}
            }}
            className="w-full bg-black/40 text-blue-100 p-3 rounded-md border border-blue-800/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-mono text-sm min-h-[120px] shadow-inner"
          />
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={path.join('.')} className="col-span-2 sm:col-span-1 mb-4">
          <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
          <input 
            type="number" 
            value={value} 
            onChange={(e) => handleChange(path, parseFloat(e.target.value) || 0)}
            className="w-full bg-black/40 text-blue-100 p-2.5 rounded-md border border-blue-800/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-mono text-sm shadow-inner" 
          />
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div key={path.join('.')} className="col-span-2 sm:col-span-1 mb-4 flex items-center h-full pt-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={value} 
              onChange={(e) => handleChange(path, e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-mono text-blue-300 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
          </label>
        </div>
      );
    }

    const isLongText = typeof value === 'string' && (value.length > 50 || key === 'description' || key === 'situation');
    
    return (
      <div key={path.join('.')} className={`mb-4 ${isLongText ? 'col-span-2' : 'col-span-2 sm:col-span-1'}`}>
        <label className="block text-xs font-mono text-blue-300 uppercase mb-1.5">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
        {isLongText ? (
          <textarea 
            value={value || ''} 
            onChange={(e) => handleChange(path, e.target.value)}
            className="w-full bg-black/40 text-blue-100 p-3 rounded-md border border-blue-800/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-mono text-sm min-h-[100px] shadow-inner leading-relaxed" 
          />
        ) : (
          <input 
            type="text" 
            value={value || ''} 
            onChange={(e) => handleChange(path, e.target.value)}
            className="w-full bg-black/40 text-blue-100 p-2.5 rounded-md border border-blue-800/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-mono text-sm shadow-inner" 
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-[#030914] border border-blue-500/40 rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(37,99,235,0.15)] overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-blue-900/50 bg-gradient-to-r from-blue-950/40 to-transparent flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/30">
                <Settings size={18} />
              </div>
              Edit {type.endsWith('s') ? type.slice(0, -1) : type}
            </h2>
            <p className="text-xs text-blue-400/70 font-mono mt-2 ml-11">Configure properties and parameters</p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-full bg-blue-950/30 flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-900/50 transition-all border border-transparent hover:border-blue-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-blue-800/50 scrollbar-track-transparent">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(formData).map(([key, value]) => renderField(key, value, [key]))}
            
            {Object.keys(formData).length === 0 && (
              <div className="col-span-2 text-center py-12 border-2 border-dashed border-blue-900/30 rounded-xl">
                <p className="text-gray-400 font-mono text-sm">No structure defined for this item.</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-5 border-t border-blue-900/50 bg-black/40 flex justify-end gap-4 backdrop-blur-md">
          <button 
            onClick={onCancel} 
            className="px-6 py-2.5 bg-transparent text-gray-400 font-mono text-sm rounded-lg hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)} 
            className="px-6 py-2.5 bg-blue-600 text-white font-mono text-sm font-bold tracking-wide rounded-lg hover:bg-blue-500 focus:ring-4 focus:ring-blue-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const [editingItem, setEditingItem] = useState<{ type: string, data: any } | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch('/api/admin/teams');
        const data = await res.json();
        if (data.success) setSessions(data.sessions);
      } else if (activeTab === 'teams') {
        const res = await fetch('/api/admin/manage-teams');
        const data = await res.json();
        if (data.success) setTeams(data.teams);
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/manage-users');
        const data = await res.json();
        if (data.success) setUsers(data.users);
      } else if (activeTab === 'scenarios') {
        const res = await fetch('/api/admin/manage-scenarios');
        const data = await res.json();
        if (data.success) setScenarios(data.scenarios);
      } else if (activeTab === 'actions') {
        const res = await fetch('/api/admin/manage-actions');
        const data = await res.json();
        if (data.success) setActions(data.actions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'overview') {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleSaveData = async (parsedData: any) => {
    const endpoint = `/api/admin/manage-${activeTab}`;
    const method = parsedData._id ? 'PUT' : 'POST';
    
    // For teams and users, creation uses POST, updating isn't fully implemented in the simple API but we can create.
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData)
      });
      if (res.ok) {
        setEditingItem(null);
        fetchData();
      } else {
        alert('Failed to save');
      }
    } catch (e) {
      alert('Error saving data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      await fetch(`/api/admin/manage-${activeTab}?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Telemetry Overview' },
    { id: 'teams', icon: Users, label: 'Manage Teams' },
    { id: 'users', icon: ShieldAlert, label: 'Manage Users' },
    { id: 'scenarios', icon: FileText, label: 'Edit Scenarios' },
    { id: 'actions', icon: Database, label: 'Edit Actions' },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans flex relative overflow-hidden">
      {/* Holographic background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,10,30,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(0,10,30,0.1)_2px,transparent_2px)] bg-[size:40px_40px] opacity-30 pointer-events-none z-0"></div>
      
      {/* Sidebar */}
      <div className="relative z-20 w-64 border-r border-blue-900/50 bg-black/80 backdrop-blur-xl flex flex-col">
        <div className="p-6 border-b border-blue-900/50">
          <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] mb-4">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-black tracking-widest uppercase text-white shadow-blue-500/50 drop-shadow-md">Admin Command</h1>
          <p className="text-xs font-mono text-blue-400">Full Access Level</p>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-2 px-4">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm transition-all ${
                  isActive 
                  ? 'bg-blue-900/50 text-blue-300 border border-blue-500/50' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon size={18} /> {item.label}
              </button>
            )
          })}
        </div>
        <div className="p-4 border-t border-blue-900/50 flex flex-col gap-2">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-300 border border-red-700/50 rounded-lg transition-colors font-mono text-sm"
          >
            <LogOut size={16} /> LOGOUT
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8 border-b border-blue-900/50 pb-6">
          <h2 className="text-3xl font-black tracking-widest uppercase">{navItems.find(i => i.id === activeTab)?.label}</h2>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 border border-blue-700/50 rounded-lg transition-colors font-mono text-sm"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> REFRESH
          </button>
        </header>

        {activeTab === 'overview' && (
          <div className="grid gap-6">
            {sessions.length === 0 && !loading && (
              <div className="text-center p-12 border border-dashed border-gray-800 rounded-2xl text-gray-500 font-mono">
                NO ACTIVE TEAMS DETECTED IN SECTOR
              </div>
            )}
            
            {sessions.map((session, i) => {
              const team = session.teamId;
              const state = session.state;
              const isCompleted = session.status === 'COMPLETED';
              
              return (
                <motion.div 
                  key={session._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative overflow-hidden p-6 rounded-2xl border backdrop-blur-md flex flex-col ${
                    isCompleted 
                      ? 'border-green-500/50 bg-green-950/20' 
                      : 'border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/30'
                  }`}
                >
                  {/* Top Row: Main Stats */}
                  <div 
                    className="flex items-center justify-between w-full cursor-pointer select-none group"
                    onClick={() => toggleExpand(session._id)}
                  >
                    <div className="flex flex-col gap-1 w-1/2">
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{team?.name}</span>
                      <span className="text-xl font-black text-white">{session.currentUserId?.name || 'Unknown User'}</span>
                      <div className="mt-2">
                        {isCompleted ? (
                          <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded text-xs font-black tracking-widest uppercase">Simulation Complete</span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded text-xs font-black tracking-widest uppercase animate-pulse">Day {state?.day || 0} / 10</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-gray-500 text-xs font-mono uppercase">Information</span>
                        <div className="text-xl font-black text-blue-400">
                          {Math.round(state?.information?.informationQuality || 0)}%
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-800/50 transition-colors">
                        {expanded[session._id] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                    </div>
                  </div>

                  {expanded[session._id] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-6 pt-6 border-t border-blue-900/50 flex flex-col gap-6"
                    >
                      <div className="grid grid-cols-4 gap-4 bg-black/40 p-4 rounded-xl border border-blue-900/30">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-gray-500 text-xs font-mono">WATER</span>
                          <div className="flex items-center gap-2 text-blue-400 font-black text-xl">
                            <Droplets size={20} /> {Math.round((((state.resources?.drinkingWater || 0) + (state.resources?.agriculturalWater || 0)) / (state.resources?.storageCapacity || 1)) * 100)}%
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-gray-500 text-xs font-mono">BUDGET</span>
                          <div className="flex items-center gap-2 text-green-400 font-black text-xl">
                            <Coins size={20} /> {((state.resources?.emergencyBudget || 0) / 1000).toFixed(0)}k
                          </div>
                        </div>
                      </div>
                      
                      {session.logs && session.logs.length > 0 && (
                        <div>
                          <h4 className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest">Team Activity & Integrity Telemetry</h4>
                          <div className="max-h-48 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                            {session.logs.map((log: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs font-mono bg-black/40 p-2.5 rounded border border-gray-900">
                                <span className="text-gray-500 w-1/4">{new Date(log.createdAt).toLocaleString()}</span>
                                <span className="text-blue-400 w-1/3">{log.userId?.name || 'Unknown User'}</span>
                                <span className="w-1/3 text-right font-bold text-yellow-500">{log.actionType.replace(/_/g, ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  {!isCompleted && (
                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500/30 w-full">
                      <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${((state.day || 0) / 10) * 100}%` }}></div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Generic Data Manager for other tabs */}
        {activeTab !== 'overview' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <button 
                onClick={() => setEditingItem({ type: activeTab, data: activeTab === 'users' ? { email: '', password: '', name: '', role: 'player' } : {} })}
                className="flex items-center gap-2 px-4 py-2 bg-green-900/30 hover:bg-green-800/50 text-green-300 border border-green-700/50 rounded-lg transition-colors font-mono text-sm"
              >
                <Plus size={16} /> Add New
              </button>
            </div>

            <div className="bg-black/40 border border-blue-900/50 rounded-xl overflow-hidden">
              <table className="w-full text-left font-mono text-sm">
                <thead className="bg-blue-950/50 text-blue-300">
                  <tr>
                    <th className="p-4 border-b border-blue-900/50">ID / Info</th>
                    <th className="p-4 border-b border-blue-900/50">Summary</th>
                    <th className="p-4 border-b border-blue-900/50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'teams' ? teams : activeTab === 'users' ? users : activeTab === 'scenarios' ? scenarios : actions).map((item, idx) => (
                    <tr key={item._id || idx} className="border-b border-gray-900 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-300">
                        <div className="font-bold text-blue-400">{item.name || item.title || item.scenarioId || item.actionId}</div>
                        <div className="text-xs text-gray-500">{item._id}</div>
                      </td>
                      <td className="p-4 text-gray-400">
                        {item.email && <div>Email: {item.email}</div>}
                        {item.role && <div>Role: {item.role}</div>}
                        {item.situation && <div className="truncate max-w-md">{item.situation}</div>}
                        {item.description && <div className="truncate max-w-md">{item.description}</div>}
                      </td>
                      <td className="p-4 flex items-center justify-end gap-2">
                        <button onClick={() => setEditingItem({ type: activeTab, data: item })} className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-800">Edit</button>
                        <button onClick={() => handleDelete(item._id)} className="px-3 py-1 bg-red-900/30 text-red-400 rounded hover:bg-red-800"><Trash size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'teams' && teams.length === 0) || (activeTab === 'users' && users.length === 0) || (activeTab === 'scenarios' && scenarios.length === 0) || (activeTab === 'actions' && actions.length === 0) ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500 font-mono">No data found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {editingItem && (
          <DynamicFormEditor 
            initialData={editingItem.data}
            type={editingItem.type}
            teams={teams}
            onSave={handleSaveData}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
