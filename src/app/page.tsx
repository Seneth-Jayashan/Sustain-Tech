'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Laptop,
  Trophy,
  CheckCircle2,
  Gamepad2,
  Radio,
  Zap,
  Crosshair,
  ShieldAlert,
  Play
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col justify-between relative overflow-hidden bg-[#030712] text-slate-100 p-4 sm:p-6 md:p-8 select-none">
      {/* Tactical Game Background: Cyber Grid, Radar Rings & Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Ambient Neon Glows */}
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[50rem] h-[28rem] bg-teal-500/15 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 -left-40 w-[32rem] h-[32rem] bg-cyan-600/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] bg-amber-500/10 rounded-full blur-[160px]" />

        {/* Tactical Radar Concentric Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] sm:w-[52rem] sm:h-[52rem] rounded-full border border-teal-500/[0.07]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] sm:w-[36rem] sm:h-[36rem] rounded-full border border-cyan-400/[0.08] border-dashed" />

        {/* Perspective Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a60a_1px,transparent_1px),linear-gradient(to_bottom,#14b8a60a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      {/* Top HUD Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Symposium Logo Banner with HUD Frame */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex items-center gap-3 bg-slate-950/85 border border-slate-800/90 hover:border-teal-500/40 p-2 sm:px-3.5 sm:py-2 rounded-2xl backdrop-blur-xl shadow-2xl transition-all"
        >
          <div className="relative h-9 sm:h-11 w-40 sm:w-56 overflow-hidden rounded-xl bg-white/95 px-2 flex items-center justify-center shadow-inner">
            <Image
              src="/assets/images/Banner.jpg"
              alt="Annual Research Symposium 2026"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>

          <div className="hidden lg:flex flex-col pr-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400 font-bold flex items-center gap-1">
              <Crosshair size={10} className="text-teal-400" />
              Research Symposium
            </span>
            <span className="text-xs font-mono text-slate-200 font-bold tracking-tight">
              SUSTAIN-TECH ARENA
            </span>
          </div>
        </motion.div>

        {/* Live Game Server Telemetry Badge */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 bg-slate-950/90 border border-teal-500/30 px-4 py-2 rounded-full text-xs font-mono shadow-[0_0_20px_rgba(20,184,166,0.12)] backdrop-blur-md"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-slate-200 font-bold tracking-wider">SERVER LIVE</span>
          <span className="text-slate-700">|</span>
          <span className="text-teal-400 font-bold flex items-center gap-1">
            <Radio size={13} className="animate-pulse" />
            2026 SEASON
          </span>
        </motion.div>
      </header>

      {/* Main Game Hero & Command Lobby */}
      <main className="relative z-10 w-full max-w-5xl mx-auto my-auto py-6 sm:py-10 flex flex-col items-center text-center">
        {/* Game Classification Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-teal-950/80 border border-teal-400/40 text-teal-300 text-xs font-mono font-bold uppercase tracking-[0.18em] mb-5 shadow-[0_0_25px_rgba(20,184,166,0.2)] backdrop-blur-md"
        >
          <div className="relative w-4 h-4 rounded overflow-hidden bg-white/95 shrink-0">
            <Image src="/assets/images/Logo.jpg" alt="Logo" fill className="object-contain" unoptimized />
          </div>
          <span>Strategic Decision Simulation System</span>
          <span className="px-1.5 py-0.5 text-[10px] bg-teal-500/20 text-teal-200 rounded border border-teal-400/30">
            v2.6
          </span>
        </motion.div>

        {/* Modern Esports / Strategy Game Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mb-4"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-none text-white drop-shadow-[0_5px_25px_rgba(0,0,0,0.8)]">
            SUSTAIN-TECH{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-400 to-emerald-400 drop-shadow-[0_0_35px_rgba(45,212,191,0.35)]">
              2026
            </span>
          </h1>
        </motion.div>

        {/* High-Octane Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed mb-8 font-medium"
        >
          Collaborate in real time, evaluate multi-variable trade-offs under constraints, and optimize critical system performance.
        </motion.p>

        {/* PRIMARY REAL GAME LAUNCH PORTAL (Button Only — No Spoilers/Details) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="w-full max-w-md mb-10"
        >
          <div className="relative group p-1 rounded-3xl bg-gradient-to-r from-teal-500/40 via-cyan-400/40 to-emerald-500/40 shadow-[0_0_50px_rgba(20,184,166,0.25)] hover:shadow-[0_0_70px_rgba(34,211,238,0.45)] transition-all duration-300">
            {/* Animated Glow Halo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500 pointer-events-none" />

            <Link
              href="/login"
              className="relative w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:from-teal-300 hover:via-cyan-300 hover:to-emerald-300 text-slate-950 font-black py-4 sm:py-5 px-8 rounded-[1.35rem] flex items-center justify-between gap-4 text-base sm:text-lg uppercase tracking-wider transition-all cursor-pointer overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-slate-950/15 text-slate-950">
                  <Trophy size={22} className="stroke-[2.5]" />
                </span>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-[0.2em] text-slate-900/80">
                    Official Tournament
                  </span>
                  <span className="text-lg sm:text-xl font-black tracking-tight">
                    Enter Real Game
                  </span>
                </div>
              </div>

              <div className="h-10 w-10 rounded-xl bg-slate-950 text-teal-400 flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-md">
                <Play size={18} className="fill-current ml-0.5" />
              </div>
            </Link>
          </div>
        </motion.div>

        {/* PRACTICE SANDBOX DECK (Tactical Game Mode Card) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="w-full max-w-4xl text-left"
        >
          <div className="relative rounded-3xl p-6 sm:p-7 bg-slate-950/80 border border-amber-500/30 hover:border-amber-400/60 backdrop-blur-2xl shadow-2xl transition-all overflow-hidden group">
            {/* HUD Corner Accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400/60 rounded-tl-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-400/60 rounded-tr-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-400/60 rounded-bl-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400/60 rounded-br-3xl pointer-events-none" />

            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Column: Mode Overview & Specs */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Gamepad2 size={14} />
                    <span>Practice Mode • Training Grounds</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Zap size={12} className="text-emerald-400" />
                    No Login Required
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-300 transition-colors tracking-tight mb-2">
                  Practice Gaming Challenge
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 max-w-2xl">
                  Test your strategic decision instincts across 3 interactive practice modules with trade-off analysis and instant debriefing before deploying into the live tournament.
                </p>

                {/* 2x2 Tactical Spec Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 font-mono">
                  <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800/80 rounded-xl px-3 py-2">
                    <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                    <span>3 Stages (Prioritize & Allocate)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800/80 rounded-xl px-3 py-2">
                    <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                    <span>Saved in Local Storage (Offline)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800/80 rounded-xl px-3 py-2">
                    <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                    <span>Instant Multi-Pillar Rating</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800/80 rounded-xl px-3 py-2">
                    <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                    <span>Unlimited Sandbox Replays</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Practice Launch CTA */}
              <div className="lg:w-64 shrink-0 flex flex-col justify-center">
                <Link
                  href="/practice"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/35 transition-all cursor-pointer"
                >
                  <Laptop size={17} className="stroke-[2.5]" />
                  <span>Start Practice</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer HUD Bar */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 border-t border-slate-900/90 pt-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-teal-400" />
          <span>Annual Research Symposium 2026</span>
          <span className="text-slate-700">•</span>
          <span>Sustain-Tech Resilience Initiative</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/practice" className="hover:text-amber-400 transition-colors">
            Practice Sandbox
          </Link>
          <span className="text-slate-700">•</span>
          <Link href="/login" className="hover:text-teal-400 transition-colors">
            Enter Real Game
          </Link>
        </div>
      </footer>
    </div>
  );
}