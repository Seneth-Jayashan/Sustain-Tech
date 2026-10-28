'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Home,
  Shield,
  Key,
  Mail,
  Lock,
  ArrowRight,
  Radio,
  Trophy,
  Gamepad2,
  Users,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Layers,
  Sliders,
  Activity,
  CheckCircle2,
  Cpu,
  Clock,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState<{ isLocked: boolean; unlockTime: string | null; timeRemainingSeconds: number; message?: string } | null>(null);
  const [isLockedRejection, setIsLockedRejection] = useState(false);

  useEffect(() => {
    fetch('/api/game/access-status')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.isLocked) {
          setLockStatus({
            isLocked: d.isLocked,
            unlockTime: d.unlockTime,
            timeRemainingSeconds: d.timeRemainingSeconds,
            message: d.message,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsLockedRejection(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isLocked) {
          setIsLockedRejection(true);
        }
        throw new Error(data.error || 'Login failed');
      }

      if (data.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/intro');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col justify-between relative overflow-hidden bg-[#030712] text-slate-100 p-4 sm:p-6 md:p-8 select-none">
      {/* Tactical Game Background: Perspective Cyber Grid & Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Ambient Neon Glows */}
        <div className="absolute -top-40 left-1/4 w-[42rem] h-[26rem] bg-teal-500/15 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 -right-40 w-[36rem] h-[36rem] bg-cyan-600/12 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 left-1/3 w-[38rem] h-[32rem] bg-amber-500/10 rounded-full blur-[160px]" />

        {/* Tactical Radar Concentric Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] sm:w-[54rem] sm:h-[54rem] rounded-full border border-teal-500/[0.06] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] sm:w-[36rem] sm:h-[36rem] rounded-full border border-cyan-400/[0.07] border-dashed pointer-events-none" />

        {/* Perspective Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a60a_1px,transparent_1px),linear-gradient(to_bottom,#14b8a60a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* TOP HUD HEADER: Home Button, Symposium Banner & Live Server Telemetry     */}
      {/* ========================================================================= */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Home Button */}
          <Link
            href="/"
            className="group flex items-center gap-2 h-10 px-3.5 sm:px-4 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-white transition-all text-xs font-mono font-bold shadow-xl backdrop-blur-xl"
            title="Return to Home Lobby"
          >
            <Home size={15} className="text-teal-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Home</span>
          </Link>

          {/* Symposium Official Banner */}
          <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800/90 hover:border-teal-500/40 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl backdrop-blur-xl shadow-xl transition-all">
            <div className="relative h-7 sm:h-8 w-32 sm:w-44 overflow-hidden rounded-lg bg-white/95 px-2 flex items-center justify-center shadow-inner">
              <Image
                src="/assets/images/Banner.jpg"
                alt="Annual Research Symposium 2026"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <span className="hidden md:inline text-[10px] font-mono text-teal-400 font-bold uppercase tracking-wider pr-1">
              Arena
            </span>
          </div>
        </div>

        {/* Live Server Status Telemetry */}
        <div className="flex items-center gap-2.5 bg-slate-950/90 border border-teal-500/30 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-mono shadow-[0_0_20px_rgba(20,184,166,0.12)] backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-slate-200 font-bold tracking-wider text-[11px] sm:text-xs">SYSTEM ONLINE</span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-teal-400 font-bold hidden sm:flex items-center gap-1 text-[11px] sm:text-xs">
            <Radio size={12} className="animate-pulse" />
            2026 TOURNAMENT ENGINE
          </span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN CONTENT: Game System Overview (Left) & Access Portal (Right) */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full max-w-7xl mx-auto my-auto py-2 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* --------------------------------------------------------------------- */}
          {/* LEFT COLUMN: System Architecture & Decision Engine Overview           */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* System Classification Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-400/40 text-teal-300 text-xs font-mono font-bold uppercase tracking-[0.16em] mb-4 shadow-[0_0_25px_rgba(20,184,166,0.2)] backdrop-blur-md"
            >
              <div className="relative w-4 h-4 rounded overflow-hidden bg-white/95 shrink-0">
                <Image src="/assets/images/Logo.jpg" alt="Logo" fill className="object-contain" unoptimized />
              </div>
              <span>Decision Simulator System</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-teal-500/20 text-teal-200 rounded border border-teal-400/30">
                v1.0
              </span>
            </motion.div>

            {/* Title with Gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-tight text-white mb-3"
            >
              SUSTAIN-TECH{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-400 to-emerald-400 drop-shadow-[0_0_35px_rgba(45,212,191,0.35)]">
                2026
              </span>
            </motion.h1>

            {/* Tagline: Focus on Game System and Strategy Mechanics */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-xl font-medium"
            >
              Multi-agent tactical decision-making platform. Coordinate team consensus in real time, analyze strategic trade-offs under constraints, and optimize critical system performance.
            </motion.p>

            {/* 4 Game System Core Architecture Badges (2x2 Grid) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6 font-mono text-xs"
            >
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/75 border border-slate-800/80 backdrop-blur-md">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
                  <Layers size={15} />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">10 Decision Rounds</span>
                  <span className="text-[11px] text-slate-400">Sequential turn-based execution & cascading impacts</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/75 border border-slate-800/80 backdrop-blur-md">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                  <Sliders size={15} />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">Resource Matrix Engine</span>
                  <span className="text-[11px] text-slate-400">Multi-variable trade-offs & constraint optimization</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/75 border border-slate-800/80 backdrop-blur-md">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <Users size={15} />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">Synchronized Teamwork</span>
                  <span className="text-[11px] text-slate-400">Real-time team consensus & concurrency protection</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/75 border border-slate-800/80 backdrop-blur-md">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                  <Trophy size={15} />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">Analytical Evaluation</span>
                  <span className="text-[11px] text-slate-400">Multi-pillar scoring & live tournament leaderboard</span>
                </div>
              </div>
            </motion.div>

            {/* Practice Sandbox Callout Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="w-full rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Gamepad2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                      Interactive Practice Sandbox
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                      No Login Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Test your tactical decision heuristics across 3 offline training stages before the live game.
                  </p>
                </div>
              </div>

              <Link
                href="/practice"
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <span>Try Practice</span>
                <ArrowRight size={13} />
              </Link>
            </motion.div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: High-Tech Glassmorphism Team Login Portal               */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.2 }}
              className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 bg-slate-950/85 border border-teal-500/30 shadow-[0_0_50px_rgba(20,184,166,0.15)] backdrop-blur-2xl overflow-hidden group"
            >
              {/* Tactical HUD Corner Accents */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-teal-400/60 rounded-tl-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-teal-400/60 rounded-tr-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-teal-400/60 rounded-bl-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-teal-400/60 rounded-br-3xl pointer-events-none" />

              {/* Ambient Corner Glow */}
              <div className="absolute -top-12 -right-12 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition-all" />

              {/* Card Header */}
              <div className="flex flex-col items-center mb-6 text-center">
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.25)]">
                    <Shield size={24} />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950" />
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1 uppercase">
                  Team Command Access
                </h2>
                <p className="text-teal-400/80 text-[11px] font-mono tracking-widest uppercase">
                  Simulation Engine Auth
                </p>
              </div>

              {/* Lock Status Notice in Card */}
              {lockStatus?.isLocked && (
                <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
                  <Lock size={15} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-200 uppercase tracking-wider text-[10px]">
                      Real Game Access Restricted
                    </span>
                    <span className="text-[11px] text-slate-300 leading-tight block mt-0.5">
                      Tournament unlocks at scheduled start time. Real Game is fully blocked until then. Practice Game is unrestricted!
                    </span>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail size={12} className="text-teal-400" />
                      Team Identifier
                    </span>
                    <span className="text-[10px] text-slate-500">Official email</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700/80 hover:border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 font-mono text-sm transition-all"
                      placeholder="team@sustaintech.online"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock size={12} className="text-teal-400" />
                      Access Code
                    </span>
                    <span className="text-[10px] text-slate-500">Assigned PIN</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700/80 hover:border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 font-mono text-sm tracking-widest transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-2 text-rose-400 text-xs font-mono bg-rose-500/10 border border-rose-500/30 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-rose-400" />
                      <span>{error}</span>
                    </div>

                    {isLockedRejection && (
                      <div className="pt-2 border-t border-rose-500/20 flex items-center gap-2 mt-1">
                        <Link
                          href="/practice"
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-lg text-center uppercase text-[10px] tracking-wider transition-all shadow-md"
                        >
                          Play Practice Game
                        </Link>
                        <Link
                          href="/locked"
                          className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-center text-[10px]"
                        >
                          View Timer
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading}
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:from-teal-300 hover:via-cyan-300 hover:to-emerald-300 text-slate-950 font-black rounded-xl py-3.5 px-4 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-slate-950" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Key size={16} className="text-slate-950 stroke-[2.5]" />
                      <span>Initialize Session</span>
                      <ArrowRight size={15} className="text-slate-950 stroke-[2.5]" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Security Protocol Footer */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1 text-slate-400">
                  <Shield size={11} className="text-teal-400" />
                  Concurrency Guard
                </span>
                <span>Session Engine v1.0 Secured</span>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* FOOTER HUD BAR: Branding & Quick Links                                    */}
      {/* ========================================================================= */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 border-t border-slate-900/90 pt-4 mt-6">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-teal-400" />
          <span>Annual Research Symposium 2026</span>
          <span className="text-slate-700">•</span>
          <span>Sustain-Tech System Architecture</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/feedback" className="hover:text-emerald-300 transition-colors flex items-center gap-1 text-emerald-400 font-semibold">
            ★ Feedback
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/" className="hover:text-teal-400 transition-colors flex items-center gap-1">
            <Home size={12} />
            <span>Lobby</span>
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/practice" className="hover:text-amber-400 transition-colors flex items-center gap-1">
            <Gamepad2 size={12} />
            <span>Practice Sandbox</span>
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/admin" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <Shield size={12} />
            <span>Admin</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
