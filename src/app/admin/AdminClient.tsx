'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Droplets, Coins, LogOut, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminClient() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/teams');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans p-8 relative overflow-hidden">
      {/* Holographic background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,10,30,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(0,10,30,0.1)_2px,transparent_2px)] bg-[size:40px_40px] opacity-30 pointer-events-none z-0"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-blue-900/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-widest uppercase">Admin Command Center</h1>
              <p className="text-sm font-mono text-blue-400">Live Simulation Telemetry</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchTeams}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 border border-blue-700/50 rounded-lg transition-colors font-mono text-sm"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> REFRESH
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-300 border border-red-700/50 rounded-lg transition-colors font-mono text-sm"
            >
              <LogOut size={16} /> LOGOUT
            </button>
          </div>
        </header>

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
                className={`relative overflow-hidden p-6 rounded-2xl border backdrop-blur-md flex items-center justify-between ${
                  isCompleted 
                    ? 'border-green-500/50 bg-green-950/20' 
                    : 'border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/30'
                }`}
              >
                {/* Left: Team Info */}
                <div className="flex flex-col gap-1 w-1/4">
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{team.email}</span>
                  <span className="text-2xl font-black text-white">{team.name}</span>
                  <div className="mt-2">
                    {isCompleted ? (
                      <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded text-xs font-black tracking-widest uppercase">Simulation Complete</span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded text-xs font-black tracking-widest uppercase animate-pulse">Day {state.currentDay} / 10</span>
                    )}
                  </div>
                </div>

                {/* Middle: Resources */}
                <div className="flex gap-8 w-2/4 justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-gray-500 text-xs font-mono">WATER</span>
                    <div className="flex items-center gap-2 text-blue-400 font-black text-xl">
                      <Droplets size={20} /> {Math.round((state.waterStorage / state.waterCapacity) * 100)}%
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-gray-500 text-xs font-mono">BUDGET</span>
                    <div className="flex items-center gap-2 text-green-400 font-black text-xl">
                      <Coins size={20} /> {(state.budget / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-gray-500 text-xs font-mono">INTEL / TRUST</span>
                    <div className="flex items-center gap-2 text-purple-400 font-black text-xl">
                      {Math.round(state.variables.I)} / {Math.round(state.variables.C)}
                    </div>
                  </div>
                </div>

                {/* Right: Score */}
                <div className="flex flex-col items-end w-1/4">
                  <span className="text-gray-500 text-xs font-mono uppercase">CPS Score</span>
                  <span className={`text-4xl font-black ${isCompleted ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]' : 'text-gray-300'}`}>
                    {isCompleted ? session.finalResult.cps : '?'}
                  </span>
                </div>
                
                {/* Status bar */}
                {!isCompleted && (
                  <div className="absolute bottom-0 left-0 h-1 bg-blue-500/30 w-full">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(state.currentDay / 10) * 100}%` }}></div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
