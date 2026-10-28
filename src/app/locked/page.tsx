'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Clock,
  Gamepad2,
  ArrowRight,
  ShieldAlert,
  Home,
  Radio,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface AccessStatus {
  isLocked: boolean;
  unlockTime: string | null;
  serverTime: string;
  timeRemainingSeconds: number;
  message: string;
}

export default function GameLockedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch access status from server
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/game/access-status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStatus({
            isLocked: data.isLocked,
            unlockTime: data.unlockTime,
            serverTime: data.serverTime,
            timeRemainingSeconds: data.timeRemainingSeconds,
            message: data.message || '',
          });
          setTimeLeft(data.timeRemainingSeconds || 0);
        }
      }
    } catch (e) {
      console.error('Error fetching lock status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll every 5s for admin time updates
    const pollInterval = setInterval(fetchStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [fetchStatus]);

  // Local second-by-second countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Re-fetch when timer reaches zero to confirm unlock
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, fetchStatus]);

  // Calculate days, hours, minutes, seconds
  const days = Math.floor(timeLeft / (3600 * 24));
  const hours = Math.floor((timeLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formatTargetTime = (isoString: string | null) => {
    if (!isoString) return 'Pending Administrator Directive';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isUnlockedNow = !loading && status && (!status.isLocked || timeLeft <= 0);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col justify-between relative overflow-hidden bg-[#030712] text-slate-100 p-4 sm:p-6 md:p-8 select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] bg-rose-600/15 rounded-full blur-[180px]" />
        <div className="absolute top-1/2 -left-40 w-[36rem] h-[36rem] bg-amber-600/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 right-1/4 w-[40rem] h-[36rem] bg-teal-500/10 rounded-full blur-[180px]" />

        {/* Concentric Radar Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] sm:w-[56rem] sm:h-[56rem] rounded-full border border-rose-500/[0.08]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] sm:w-[38rem] sm:h-[38rem] rounded-full border border-amber-400/[0.08] border-dashed" />

        {/* Perspective Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f43f5e0a_1px,transparent_1px),linear-gradient(to_bottom,#f43f5e0a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      {/* Top HUD Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-white transition-all text-xs font-mono font-bold shadow-xl backdrop-blur-xl cursor-pointer"
          >
            <Home size={15} className="text-teal-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Home Lobby</span>
          </Link>

          <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800/90 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl backdrop-blur-xl shadow-xl">
            <div className="relative h-7 sm:h-8 w-32 sm:w-44 overflow-hidden rounded-lg bg-white/95 px-2 flex items-center justify-center">
              <Image
                src="/assets/images/Banner.jpg"
                alt="Annual Research Symposium 2026"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <span className="hidden md:inline text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider pr-1">
              Command Access
            </span>
          </div>
        </div>

        {/* Live Server Telemetry */}
        <div className="flex items-center gap-2.5 bg-slate-950/90 border border-rose-500/30 px-4 py-2 rounded-full text-xs font-mono shadow-[0_0_20px_rgba(244,63,94,0.12)] backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <span className="text-slate-200 font-bold tracking-wider text-[11px] sm:text-xs">
            {isUnlockedNow ? 'TOURNAMENT ACTIVE' : 'ARENA LOCKED'}
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px] sm:text-xs">
            <Radio size={12} className="animate-pulse" />
            LIVE PROTOCOL
          </span>
        </div>
      </header>

      {/* Main Holding Console */}
      <main className="relative z-10 w-full max-w-4xl mx-auto my-auto py-4 flex flex-col items-center text-center">
        {/* Status Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-mono font-bold uppercase tracking-[0.18em] mb-4 shadow-xl backdrop-blur-md ${
            isUnlockedNow
              ? 'bg-emerald-950/80 border-emerald-400/40 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
              : 'bg-rose-950/80 border-rose-400/40 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
          }`}
        >
          {isUnlockedNow ? (
            <>
              <Unlock size={14} className="text-emerald-400 animate-bounce" />
              <span>Real Game Tournament Unlocked</span>
            </>
          ) : (
            <>
              <Lock size={14} className="text-rose-400 animate-pulse" />
              <span>Real Game Access Restricted</span>
            </>
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-3 drop-shadow-[0_5px_25px_rgba(0,0,0,0.8)]"
        >
          {isUnlockedNow ? (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400">
              The Tournament Has Begun!
            </span>
          ) : (
            <>
              Real Game{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-orange-400">
                Starts Soon
              </span>
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-300 text-sm sm:text-base max-w-xl mb-6 font-medium leading-relaxed"
        >
          {isUnlockedNow
            ? 'The scheduled start time has passed. Access is now open. Authenticate your team credentials to deploy into the live simulation.'
            : 'The official simulation is sealed until the scheduled start time configured by symposium administrators. Only the practice simulator is currently accessible.'}
        </motion.p>

        {/* Scheduled Start Time Badge */}
        {!isUnlockedNow && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 mb-6 shadow-inner"
          >
            <Calendar size={15} className="text-amber-400" />
            <span className="text-slate-400">Target Unlock:</span>
            <span className="font-bold text-amber-300">
              {status?.unlockTime ? formatTargetTime(status.unlockTime) : 'Scheduled by Administrator'}
            </span>
          </motion.div>
        )}

        {/* Custom Admin Announcement Message */}
        {status?.message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-mono flex items-start gap-3 text-left backdrop-blur-md"
          >
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 uppercase tracking-wider block text-[10px] mb-1">
                Command Broadcast:
              </span>
              <span>{status.message}</span>
            </div>
          </motion.div>
        )}

        {/* Holographic Countdown Grid */}
        {!isUnlockedNow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-xl mb-8"
          >
            {[
              { label: 'DAYS', value: days },
              { label: 'HOURS', value: hours },
              { label: 'MINUTES', value: minutes },
              { label: 'SECONDS', value: seconds },
            ].map((unit, idx) => (
              <div
                key={unit.label}
                className="relative rounded-2xl p-3 sm:p-4 bg-slate-950/90 border border-slate-800/90 hover:border-amber-400/50 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center transition-all group overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                <span className="text-2xl sm:text-4xl md:text-5xl font-mono font-black text-amber-300 tracking-tight group-hover:scale-105 transition-transform">
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold mt-1">
                  {unit.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* ACTION CARDS / BUTTONS */}
        {isUnlockedNow ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Link
              href="/login"
              className="w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:from-teal-300 hover:via-cyan-300 hover:to-emerald-300 text-slate-950 font-black py-4 sm:py-5 px-8 rounded-2xl flex items-center justify-center gap-3 text-base sm:text-lg uppercase tracking-wider shadow-[0_0_50px_rgba(20,184,166,0.35)] transition-all cursor-pointer"
            >
              <Zap size={20} className="stroke-[2.5]" />
              <span>Enter Real Game Now</span>
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        ) : (
          /* PRACTICE SANDBOX CARD (High visibility CTA while waiting) */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-2xl text-left"
          >
            <div className="relative rounded-3xl p-6 sm:p-7 bg-slate-950/85 border border-teal-500/40 hover:border-teal-400/70 backdrop-blur-2xl shadow-2xl transition-all overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition-all" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/20 border border-teal-400/40 text-teal-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={11} />
                      Available Now
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      No Login Required
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-teal-300 transition-colors tracking-tight mb-2">
                    Play Practice Gaming Challenge
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mb-3">
                    Warm up before the real game unlocks. Test your multi-variable decision instincts across 3 interactive practice stages with zero consequence.
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-teal-300">
                      <CheckCircle2 size={13} /> 3 Scenario Modules
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-300">
                      <CheckCircle2 size={13} /> Instant TPI Scoring
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col justify-center">
                  <Link
                    href="/practice"
                    className="w-full sm:w-auto bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-all cursor-pointer"
                  >
                    <Gamepad2 size={16} />
                    <span>Launch Practice</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer HUD */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 border-t border-slate-900/90 pt-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-rose-400" />
          <span>Sustain-Tech Strategic Simulation 2026</span>
          <span className="text-slate-700">•</span>
          <span>Access Control Directive Active</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/practice" className="text-teal-400 hover:underline">
            Practice Grounds
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/login" className="hover:text-slate-200 transition-colors">
            Admin / Team Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
