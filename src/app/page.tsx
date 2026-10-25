'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Users,
  Laptop,
  Activity,
  Trophy,
  Layers,
  CheckCircle2,
  Clock,
  Database,
  Cpu
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col justify-between relative overflow-hidden bg-[#050b14] text-slate-100 p-4 sm:p-6 md:p-8 select-none">
      {/* Ambient background glows & radar grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-teal-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] bg-cyan-600/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf808_1px,transparent_1px),linear-gradient(to_bottom,#38bdf808_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute inset-0 bg-radial-vignette opacity-80" />
      </div>

      {/* Top Header Section */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Symposium Logo Banner */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5 sm:gap-3.5 bg-slate-900/80 border border-slate-800/90 hover:border-teal-500/40 p-2 sm:px-3 sm:py-2 rounded-2xl backdrop-blur-xl shadow-xl transition-all"
        >
          {/* Official Emblem Logo */}
          {/* <div className="relative h-9 w-9 sm:h-11 sm:w-11 overflow-hidden rounded-xl bg-white/95 p-1 border border-teal-500/30 shrink-0 shadow flex items-center justify-center">
            <Image
              src="/assets/images/Logo.jpg"
              alt="Symposium Logo"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div> */}

          {/* Official Horizontal Banner */}
          <div className="relative h-9 sm:h-11 w-40 sm:w-56 overflow-hidden rounded-xl bg-white/95 px-2 flex items-center justify-center shadow">
            <Image
              src="/assets/images/Banner.jpg"
              alt="Annual Research Symposium 2026"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>

          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400 font-bold">Research Symposium</span>
            <span className="text-xs font-mono text-slate-300 font-bold">Sustain-Tech Platform</span>
          </div>
        </motion.div>

        {/* System Online Badge */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-full text-xs font-mono shadow-lg backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-slate-300 font-semibold">SIMULATION NETWORK ONLINE</span>
          <span className="text-slate-600">|</span>
          <span className="text-teal-400 font-bold">2026 EDITION</span>
        </motion.div>
      </header>

      {/* Hero Center Body */}
      <main className="relative z-10 w-full max-w-6xl mx-auto my-auto py-6 sm:py-10 flex flex-col items-center text-center">
        {/* Tactical Category Chip with Emblem */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold uppercase tracking-wider mb-4 shadow-lg backdrop-blur-md"
        >
          <div className="relative w-4 h-4 rounded overflow-hidden bg-white/90 shrink-0">
            <Image src="/assets/images/Logo.jpg" alt="Logo" fill className="object-contain" unoptimized />
          </div>
          <span>Disaster Command & Strategic Resilience Simulator</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-3"
        >
          SUSTAIN-TECH <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400">2026</span>
        </motion.h1>

        {/* Mission Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed mb-8 sm:mb-12 font-medium"
        >
          Lead multi-sector disaster response under acute uncertainty, compounding weather hazards, and strict budget caps. Choose your simulation mode to begin:
        </motion.p>

        {/* Mode Selection Cards (Focal Point) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl text-left">
          {/* Card 1: Practice Gaming Challenge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-3xl p-6 sm:p-7 bg-slate-950/70 border border-amber-500/30 hover:border-amber-400/70 backdrop-blur-xl shadow-2xl flex flex-col justify-between transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

            <div>
              {/* Card Badge */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Laptop size={13} />
                  <span>Practice Mode • Sandbox</span>
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  No Login Required
                </span>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors tracking-tight mb-2">
                Practice Gaming Challenge
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Interactive 3-day sandbox challenge with disaster budgeting and tactical debrief. Perfect for familiarizing yourself with command mechanics before the tournament.
              </p>

              {/* Feature Bullets */}
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>3-Day scenario with Day 2 Resource Allocation (100M cap)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>Answers saved in your PC's Local Storage (offline-friendly)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>Instant demo results with multi-pillar performance rating</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>Play anytime with unlimited practice replays</span>
                </li>
              </ul>
            </div>

            {/* Launch Button */}
            <Link
              href="/practice"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm tracking-wide shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-all cursor-pointer"
            >
              <span>Start Practice Challenge</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Card 2: Tournament Simulation (Real Game) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-3xl p-6 sm:p-7 bg-slate-950/70 border border-teal-500/30 hover:border-teal-400/70 backdrop-blur-xl shadow-2xl flex flex-col justify-between transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition-all" />

            <div>
              {/* Card Badge */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-teal-500/10 border border-teal-500/30 text-teal-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Trophy size={13} />
                  <span>Tournament Game • Official</span>
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  Team Login
                </span>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl font-black text-white group-hover:text-teal-300 transition-colors tracking-tight mb-2">
                Real Challenge (Official)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                The authoritative 10-day compound crisis simulation. Features live server-enforced round timers, cascade hazards, credit lines, and the official championship leaderboard.
              </p>

              {/* Feature Bullets */}
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                  <span>10-Day Kelani River Basin flood & drought compound crisis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                  <span>Strict authoritative round deadlines with fallback protocols</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                  <span>Comprehensive scoring (CPS + Team Performance Index TPI)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                  <span>Ranked against peer disaster teams on the live leaderboard</span>
                </li>
              </ul>
            </div>

            {/* Launch Button -> Goes to Login */}
            <Link
              href="/login"
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-black font-black py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 text-sm tracking-wide shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-all cursor-pointer"
            >
              <span>Enter Real Game (Team Login)</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 border-t border-slate-900/80 pt-4">
        <div className="flex items-center gap-2">
          <span>Annual Research Symposium 2026</span>
          <span className="text-slate-600">•</span>
          <span>Sustain-Tech Resilience Initiative</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/practice" className="hover:text-amber-400 transition-colors">
            Practice Challenge
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/login" className="hover:text-teal-400 transition-colors">
            Team Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
