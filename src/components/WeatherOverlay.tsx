'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Sun, Scale } from 'lucide-react';
import { playThunderSound } from '@/lib/audio';

export type AtmosphereMode = 'auto' | 'dual' | 'flood' | 'drought';

interface Props {
  floodScore: number;
  droughtScore: number;
  drinkingWater?: number;
  riverLevel?: number;
  rainfall?: number;
  day?: number;
  bucket?: number;
  activeAtmosphere?: AtmosphereMode;
  onAtmosphereChange?: (mode: AtmosphereMode) => void;
  soundEnabled?: boolean;
}

// Procedural realistic branching lightning bolt SVG paths
const LIGHTNING_BOLTS = [
  // Bolt 1: Central vertical jagged lightning with 3 branches
  `M 160,0 L 175,70 L 145,120 L 185,190 L 150,250 L 195,330 L 165,400 L 180,490 
   M 175,70 L 215,105 L 245,135 
   M 185,190 L 225,225 L 240,270 
   M 150,250 L 115,290 L 95,340 
   M 195,330 L 235,360`,

  // Bolt 2: Angled storm strike with intense fork branching
  `M 210,0 L 185,85 L 225,140 L 180,215 L 215,280 L 165,360 L 195,440 L 175,500 
   M 185,85 L 145,125 L 120,165 
   M 225,140 L 265,180 L 290,230 
   M 180,215 L 135,255 L 110,310 
   M 215,280 L 255,320 L 275,380`,

  // Bolt 3: Powerful deep jagged strike
  `M 140,0 L 165,65 L 130,125 L 175,200 L 140,270 L 170,350 L 145,430 L 165,490 
   M 165,65 L 205,100 L 230,145 
   M 130,125 L 95,165 L 75,215 
   M 175,200 L 215,240 L 235,290 
   M 140,270 L 110,310 L 95,365`
];

export default function WeatherOverlay({
  floodScore,
  droughtScore,
  drinkingWater = 50,
  riverLevel = 50,
  rainfall = 50,
  day = 0,
  bucket = 1,
  activeAtmosphere,
  onAtmosphereChange,
  soundEnabled = true
}: Props) {
  // Internal state if parent doesn't manage mode
  const [internalMode, setInternalMode] = useState<AtmosphereMode>('auto');

  const mode = activeAtmosphere ?? internalMode;
  const setMode = onAtmosphereChange ?? setInternalMode;

  // Real-time automated situation calculation
  const autoSituation = useMemo<'dual' | 'flood' | 'drought'>(() => {
    // Score difference: floodPreparedness vs droughtPreparedness
    const scoreDiff = floodScore - droughtScore;

    // Severe critical flood conditions: low flood preparedness, high river level, or torrential rain
    if (floodScore < 38 || riverLevel > 70 || rainfall > 75 || scoreDiff < -7) {
      return 'flood';
    }
    // Severe critical drought conditions: low drought preparedness or acute drinking water deficit
    if (droughtScore < 35 || drinkingWater < 35 || scoreDiff > 7) {
      return 'drought';
    }

    // Days 0 & 2 (Buckets 1 & 2) are by design compound disaster rounds
    // Balanced states default to compound/dual (RainAndDry)
    if (bucket <= 2 || day <= 2) {
      return 'dual';
    }

    return 'dual';
  }, [floodScore, droughtScore, drinkingWater, riverLevel, rainfall, day, bucket]);

  const effectiveSituation = mode === 'auto' ? autoSituation : mode;
  const isRaining = effectiveSituation === 'flood' || effectiveSituation === 'dual';

  // Real-time Thunder & Lightning Visual and Sound FX
  const [lightning, setLightning] = useState<{
    active: boolean;
    intensity: number;
    boltIndex: number;
    boltLeft: number;
  }>({
    active: false,
    intensity: 0,
    boltIndex: 0,
    boltLeft: 25
  });

  useEffect(() => {
    if (!isRaining) {
      setLightning(prev => prev.active ? { ...prev, active: false, intensity: 0 } : prev);
      return;
    }

    const timeoutIds: NodeJS.Timeout[] = [];
    let isCancelled = false;

    const triggerStrike = () => {
      if (isCancelled) return;

      const boltIndex = Math.floor(Math.random() * LIGHTNING_BOLTS.length);
      // In dual mode, rain is restricted to the left half (0% to 50%)
      const boltLeft = effectiveSituation === 'dual'
        ? 6 + Math.random() * 32
        : 10 + Math.random() * 65;

      // 1. Initial pre-flash
      setLightning({ active: true, intensity: 0.75, boltIndex, boltLeft });

      // 2. Micro dip
      timeoutIds.push(setTimeout(() => {
        if (!isCancelled) setLightning(prev => ({ ...prev, intensity: 0.3 }));
      }, 50));

      // 3. Main high-voltage peak strike + play thunder audio
      timeoutIds.push(setTimeout(() => {
        if (!isCancelled) {
          setLightning(prev => ({ ...prev, intensity: 1.0 }));
          if (soundEnabled) {
            playThunderSound(0.6);
          }
        }
      }, 100));

      // 4. Afterglow decay
      timeoutIds.push(setTimeout(() => {
        if (!isCancelled) setLightning(prev => ({ ...prev, intensity: 0.45 }));
      }, 240));

      // 5. Fade to dark
      timeoutIds.push(setTimeout(() => {
        if (!isCancelled) setLightning(prev => ({ ...prev, intensity: 0 }));
      }, 380));

      // 6. Complete strike
      timeoutIds.push(setTimeout(() => {
        if (!isCancelled) setLightning(prev => ({ ...prev, active: false }));
      }, 550));

      // Schedule next organic storm strike between 14 and 25 seconds
      const nextDelay = 14000 + Math.random() * 11000;
      timeoutIds.push(setTimeout(triggerStrike, nextDelay));
    };

    // Trigger initial strike 3.5 seconds after entering rain
    const initialDelay = 3500;
    timeoutIds.push(setTimeout(triggerStrike, initialDelay));

    return () => {
      isCancelled = true;
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [isRaining, effectiveSituation, soundEnabled]);

  // Static deterministic particles (avoids SSR/CSR hydration mismatch and re-render loops)
  const dustParticles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: ((i * 37) % 94) + 3,
        delay: (i * 1.7) % 5,
        duration: 4.5 + ((i * 0.9) % 4),
        size: 2 + ((i * 1.3) % 4)
      })),
    []
  );

  const rainDrops = useMemo(
    () =>
      Array.from({ length: 45 }, (_, i) => ({
        id: i,
        left: ((i * 23) % 98) + 1,
        delay: (i * 0.45) % 2,
        duration: 0.55 + ((i * 0.1) % 0.4),
        height: 25 + ((i * 7) % 35),
        opacity: 0.35 + ((i * 0.12) % 0.5)
      })),
    []
  );

  const bubbles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: ((i * 53) % 80) + 10,
        delay: (i * 1.3) % 4,
        duration: 3 + ((i * 0.8) % 3),
        size: 4 + ((i * 1.5) % 8)
      })),
    []
  );

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. CINEMATIC BACKGROUND IMAGES LAYER (FULLSCREEN CROSSFADE)               */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Layer 1: RainAndDry.png (Default / Compound Hazard) */}
        <motion.div
          initial={false}
          animate={{ opacity: effectiveSituation === 'dual' ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/RainAndDry.png"
            alt="Rain and Dry Dual Environment"
            className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.08]"
          />
        </motion.div>

        {/* Layer 2: Flood.png (Flood Situation) */}
        <motion.div
          initial={false}
          animate={{ opacity: effectiveSituation === 'flood' ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/Flood.png"
            alt="Flood Disaster Environment"
            className="w-full h-full object-cover object-center filter brightness-[0.84] contrast-[1.12]"
          />
        </motion.div>

        {/* Layer 3: Drought.png (Drought Situation) */}
        <motion.div
          initial={false}
          animate={{ opacity: effectiveSituation === 'drought' ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/Drought.png"
            alt="Drought Disaster Environment"
            className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.15]"
          />
        </motion.div>

        {/* Cinematic Atmospheric Color Grades */}
        <motion.div
          animate={{
            background:
              effectiveSituation === 'flood'
                ? 'radial-gradient(ellipse at 50% 100%, rgba(6,182,212,0.18) 0%, rgba(3,105,161,0.12) 40%, rgba(2,6,23,0.7) 100%)'
                : effectiveSituation === 'drought'
                ? 'radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.22) 0%, rgba(234,88,12,0.12) 40%, rgba(2,6,23,0.7) 100%)'
                : 'radial-gradient(ellipse at 50% 50%, rgba(15,23,42,0.2) 0%, rgba(2,6,23,0.7) 100%)'
          }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 mix-blend-multiply"
        />

        {/* Tactical Edge Vignette to Guarantee Readability */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_rgba(2,6,23,0.85)_100%)] pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* 2. REAL-TIME DROUGHT EFFECTS: EARTH CRACKS, HEAT HAZE & DUST              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {(effectiveSituation === 'drought' || effectiveSituation === 'dual') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: effectiveSituation === 'drought' ? 1 : 0.65 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className={`fixed inset-0 pointer-events-none z-[2] overflow-hidden ${
              effectiveSituation === 'dual' ? 'clip-path-right-half' : ''
            }`}
            style={
              effectiveSituation === 'dual'
                ? { clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 48% 100%)' }
                : undefined
            }
          >
            {/* Scorched Earth Ambient Thermal Glow at Horizon / Ground */}
            <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-orange-600/20 via-amber-700/10 to-transparent pointer-events-none mix-blend-screen" />

            {/* Sun Scorch / Thermal Glare */}
            {effectiveSituation === 'drought' && (
              <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none mix-blend-screen" />
            )}

            {/* Procedural Earth Cracks SVG Network */}
            <div className="absolute bottom-0 inset-x-0 w-full h-[55vh] max-h-[480px] pointer-events-none overflow-hidden animate-heat-haze">
              <svg
                viewBox="0 0 1440 480"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full object-cover object-bottom"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Glowing Magma / Parched Fissure Gradient */}
                  <linearGradient id="fissureCore" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#f97316" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="fissureCoreHot" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#ea580c" stopOpacity="0.95" />
                    <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#fef08a" stopOpacity="0.6" />
                  </linearGradient>

                  <filter id="crackGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* --- Primary Fault Line 1 (Center-Left to Bottom) --- */}
                {/* 3D Chasm Dark Bed */}
                <path
                  d="M 240,480 L 310,380 L 370,340 L 440,290 L 510,250 L 580,210 L 640,180 L 710,150 L 780,120"
                  stroke="#0f0702"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Glowing Fissure Outer Wall */}
                <path
                  d="M 240,480 L 310,380 L 370,340 L 440,290 L 510,250 L 580,210 L 640,180 L 710,150 L 780,120"
                  stroke="url(#fissureCore)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#crackGlow)"
                  className="animate-crack-pulse"
                />
                {/* Incandescent Core Strand */}
                <path
                  d="M 240,480 L 310,380 L 370,340 L 440,290 L 510,250 L 580,210 L 640,180 L 710,150 L 780,120"
                  stroke="#fef08a"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />

                {/* Sub-branch 1A (Spreading Leftwards into Ground) */}
                <path
                  d="M 370,340 L 320,290 L 260,270 L 200,280 L 140,260"
                  stroke="#0f0702"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 370,340 L 320,290 L 260,270 L 200,280 L 140,260"
                  stroke="url(#fissureCoreHot)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#crackGlow)"
                  className="animate-crack-pulse"
                />
                <path
                  d="M 260,270 L 230,220 L 180,200 L 130,210"
                  stroke="url(#fissureCore)"
                  strokeWidth="1.2"
                  strokeOpacity="0.75"
                />

                {/* Sub-branch 1B (Spreading Rightward into Center Plate) */}
                <path
                  d="M 510,250 L 560,210 L 610,170 L 670,160"
                  stroke="#0f0702"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 510,250 L 560,210 L 610,170 L 670,160"
                  stroke="url(#fissureCore)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="animate-crack-pulse"
                />

                {/* --- Primary Fault Line 2 (Center-Right to Bottom) --- */}
                {/* 3D Chasm Dark Bed */}
                <path
                  d="M 1240,480 L 1170,390 L 1100,340 L 1020,300 L 960,260 L 890,220 L 820,180 L 760,150 L 710,150"
                  stroke="#0f0702"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Glowing Fissure Outer Wall */}
                <path
                  d="M 1240,480 L 1170,390 L 1100,340 L 1020,300 L 960,260 L 890,220 L 820,180 L 760,150 L 710,150"
                  stroke="url(#fissureCoreHot)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#crackGlow)"
                  className="animate-crack-pulse"
                />
                {/* Incandescent Core Strand */}
                <path
                  d="M 1240,480 L 1170,390 L 1100,340 L 1020,300 L 960,260 L 890,220 L 820,180 L 760,150 L 710,150"
                  stroke="#fef08a"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />

                {/* Sub-branch 2A (Spreading into Far Right Flank) */}
                <path
                  d="M 1100,340 L 1150,290 L 1220,270 L 1300,250 L 1380,240"
                  stroke="#0f0702"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 1100,340 L 1150,290 L 1220,270 L 1300,250 L 1380,240"
                  stroke="url(#fissureCore)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="animate-crack-pulse"
                />
                <path
                  d="M 1220,270 L 1260,210 L 1330,190"
                  stroke="url(#fissureCoreHot)"
                  strokeWidth="1.2"
                  strokeOpacity="0.7"
                />

                {/* Sub-branch 2B (Spreading toward Center Mesa) */}
                <path
                  d="M 960,260 L 920,200 L 940,150 L 900,110"
                  stroke="#0f0702"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M 960,260 L 920,200 L 940,150 L 900,110"
                  stroke="url(#fissureCore)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="animate-crack-pulse"
                />

                {/* --- Primary Fault Line 3 (Center Deep Crevice) --- */}
                <path
                  d="M 720,480 L 700,410 L 730,350 L 690,290 L 720,230 L 710,150"
                  stroke="#0f0702"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 720,480 L 700,410 L 730,350 L 690,290 L 720,230 L 710,150"
                  stroke="url(#fissureCore)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="animate-crack-pulse"
                />

                {/* Tributary Micro-Fissures in Ground Soil */}
                <path
                  d="M 450,440 L 480,410 L 530,420 L 560,390"
                  stroke="url(#fissureCore)"
                  strokeWidth="1.5"
                  strokeOpacity="0.8"
                />
                <path
                  d="M 980,440 L 940,410 L 910,430 L 870,400"
                  stroke="url(#fissureCoreHot)"
                  strokeWidth="1.5"
                  strokeOpacity="0.8"
                />
                <path
                  d="M 60,420 L 110,390 L 150,410 L 190,380"
                  stroke="url(#fissureCore)"
                  strokeWidth="1.4"
                  strokeOpacity="0.75"
                />
                <path
                  d="M 1340,430 L 1290,400 L 1250,420"
                  stroke="url(#fissureCore)"
                  strokeWidth="1.4"
                  strokeOpacity="0.75"
                />

                {/* Glowing Geothermal Junction Nodes */}
                {[
                  { cx: 370, cy: 340, r: 4 },
                  { cx: 510, cy: 250, r: 3.5 },
                  { cx: 710, cy: 150, r: 4.5 },
                  { cx: 960, cy: 260, r: 4 },
                  { cx: 1100, cy: 340, r: 4 },
                  { cx: 1220, cy: 270, r: 3.5 }
                ].map((node, i) => (
                  <circle
                    key={i}
                    cx={node.cx}
                    cy={node.cy}
                    r={node.r}
                    fill="#fef08a"
                    filter="url(#crackGlow)"
                    className="animate-crack-pulse"
                  />
                ))}
              </svg>
            </div>

            {/* Floating Dry Dust & Glowing Micro-Embers Rising from the Earth Cracks */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {dustParticles.map(p => (
                <div
                  key={p.id}
                  className="absolute bottom-4 rounded-full animate-dust-float"
                  style={{
                    left: `${p.left}%`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.id % 3 === 0 ? '#fbbf24' : p.id % 2 === 0 ? '#f97316' : '#fed7aa',
                    boxShadow: p.id % 2 === 0 ? '0 0 8px rgba(249, 115, 22, 0.8)' : 'none',
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.duration}s`
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. REAL-TIME FLOOD EFFECTS: WATER FLOATING HEAVILY, BUOYS & TORRENTIAL RAIN */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {(effectiveSituation === 'flood' || effectiveSituation === 'dual') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: effectiveSituation === 'flood' ? 1 : 0.65 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className={`fixed inset-0 pointer-events-none z-[3] overflow-hidden ${
              effectiveSituation === 'dual' ? 'clip-path-left-half' : ''
            }`}
            style={
              effectiveSituation === 'dual'
                ? { clipPath: 'polygon(0 0, 52% 0, 50% 100%, 0 100%)' }
                : undefined
            }
          >
            {/* Driving Angled Rain Streaks */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {rainDrops.map(drop => (
                <div
                  key={drop.id}
                  className="absolute top-0 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-200 to-blue-400 rounded-full"
                  style={{
                    left: `${drop.left}%`,
                    height: `${drop.height}px`,
                    opacity: drop.opacity,
                    transform: 'rotate(-12deg)',
                    animation: `rainDropAngled ${drop.duration}s linear infinite`,
                    animationDelay: `${drop.delay}s`
                  }}
                />
              ))}
            </div>

            {/* Heavy Floating Water Surge Basin (Lower 34% of screen) */}
            <div className="absolute bottom-0 inset-x-0 h-[34vh] min-h-[220px] max-h-[380px] pointer-events-none overflow-hidden">
              {/* Deep Water Ambient Wash */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#021827]/95 via-[#03344e]/75 to-transparent pointer-events-none" />

              {/* Multi-Layer Flowing Sinusoidal Waves */}
              {/* Wave Layer 1 (Deep Navy Back Swell) */}
              <div className="absolute bottom-0 inset-x-0 w-[120%] -ml-[10%] h-full animate-flood-wave-back opacity-80 pointer-events-none">
                <svg
                  viewBox="0 0 1440 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full object-cover"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0,90 Q 240,40 480,85 T 960,75 T 1440,90 L 1440,280 L 0,280 Z"
                    fill="url(#deepWaterGrad)"
                  />
                  <defs>
                    <linearGradient id="deepWaterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#083344" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#02141e" stopOpacity="0.98" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Wave Layer 2 (Mid-Level Fluid Cyan Surge) */}
              <div className="absolute bottom-0 inset-x-0 w-[120%] -ml-[5%] h-full animate-flood-wave-mid opacity-70 pointer-events-none">
                <svg
                  viewBox="0 0 1440 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full object-cover"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0,115 Q 220,150 440,110 T 880,120 T 1320,105 T 1440,120 L 1440,280 L 0,280 Z"
                    fill="url(#midWaterGrad)"
                  />
                  <defs>
                    <linearGradient id="midWaterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0e7490" stopOpacity="0.75" />
                      <stop offset="60%" stopColor="#064e63" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#022c3d" stopOpacity="0.95" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Wave Layer 3 (Foreground Wave with Highlight Crest & Froth) */}
              <div className="absolute bottom-0 inset-x-0 w-[120%] -ml-[10%] h-full animate-flood-wave-front opacity-85 pointer-events-none">
                <svg
                  viewBox="0 0 1440 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full object-cover"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0,140 Q 180,105 360,140 T 720,130 T 1080,145 T 1440,135 L 1440,280 L 0,280 Z"
                    fill="url(#frontWaterGrad)"
                  />
                  {/* Glossy Specular Wave Crest Highlight Stroke */}
                  <path
                    d="M 0,140 Q 180,105 360,140 T 720,130 T 1080,145 T 1440,135"
                    stroke="#cffafe"
                    strokeWidth="2.5"
                    strokeOpacity="0.65"
                  />
                  <defs>
                    <linearGradient id="frontWaterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.55" />
                      <stop offset="40%" stopColor="#0891b2" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#042f3e" stopOpacity="0.98" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* ========================================================================= */}
              {/* HEAVY FLOATING ITEMS BOBBING ON THE WATER SURFACE                         */}
              {/* ========================================================================= */}

              {/* Item 1: Floating Hazardous Chemical / Fuel Drum Barrel */}
              <div
                className="absolute left-[18%] bottom-[42%] pointer-events-none animate-heavy-bob"
                style={{ width: '64px', height: '80px' }}
              >
                {/* Surface Water Splash & Ripples beneath barrel */}
                <div className="absolute -bottom-2 -left-4 w-24 h-6 rounded-full border border-cyan-400/50 bg-cyan-500/20 blur-[1px] animate-water-ripple" />
                <div className="absolute -bottom-1 -left-2 w-20 h-4 rounded-full bg-cyan-900/60 blur-[2px]" />

                {/* Industrial Emergency Floating Drum SVG */}
                <svg viewBox="0 0 64 80" className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
                  {/* Drum Body */}
                  <rect x="8" y="10" width="48" height="60" rx="8" fill="#ea580c" stroke="#9a3412" strokeWidth="2" />
                  {/* Dark Reinforcing Ribs */}
                  <rect x="6" y="24" width="52" height="4" rx="2" fill="#7c2d12" />
                  <rect x="6" y="44" width="52" height="4" rx="2" fill="#7c2d12" />
                  {/* Top Cap */}
                  <ellipse cx="32" cy="12" rx="24" ry="7" fill="#fb923c" stroke="#c2410c" strokeWidth="1.5" />
                  <circle cx="24" cy="12" r="3" fill="#475569" />
                  <circle cx="40" cy="12" r="2" fill="#334155" />
                  {/* Biohazard / Emergency Warning Stripe */}
                  <rect x="8" y="31" width="48" height="10" fill="#facc15" />
                  <line x1="12" y1="31" x2="20" y2="41" stroke="#000" strokeWidth="2.5" />
                  <line x1="24" y1="31" x2="32" y2="41" stroke="#000" strokeWidth="2.5" />
                  <line x1="36" y1="31" x2="44" y2="41" stroke="#000" strokeWidth="2.5" />
                  <line x1="48" y1="31" x2="54" y2="41" stroke="#000" strokeWidth="2.5" />
                  {/* Submerged Waterline Cutoff Wash */}
                  <path d="M 6,56 Q 32,64 58,56 L 58,74 L 6,74 Z" fill="rgba(6, 182, 212, 0.45)" />
                </svg>
              </div>

              {/* Item 2: Floating Marine Rescue Lifebuoy Ring with Flashing Strobe */}
              <div
                className="absolute right-[22%] bottom-[40%] pointer-events-none animate-heavy-bob-alt"
                style={{ width: '74px', height: '74px' }}
              >
                {/* Water Ripple Ring */}
                <div className="absolute -bottom-2 -left-3 w-24 h-6 rounded-full border border-cyan-300/40 bg-cyan-400/20 blur-[1px] animate-water-ripple" style={{ animationDelay: '1.2s' }} />

                <svg viewBox="0 0 80 80" className="w-full h-full filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]">
                  {/* Outer Life Ring */}
                  <circle cx="40" cy="40" r="32" fill="#f97316" stroke="#c2410c" strokeWidth="2" />
                  {/* Inner Hole */}
                  <circle cx="40" cy="40" r="16" fill="rgba(6, 78, 99, 0.7)" stroke="#c2410c" strokeWidth="1.5" />
                  {/* White Reflective Panels */}
                  <path d="M 40,8 A 32,32 0 0,1 62.6,17.4 L 51.3,28.7 A 16,16 0 0,0 40,24 Z" fill="#ffffff" />
                  <path d="M 40,72 A 32,32 0 0,1 17.4,62.6 L 28.7,51.3 A 16,16 0 0,0 40,56 Z" fill="#ffffff" />
                  <path d="M 72,40 A 32,32 0 0,1 62.6,62.6 L 51.3,51.3 A 16,16 0 0,0 56,40 Z" fill="#ffffff" />
                  <path d="M 8,40 A 32,32 0 0,1 17.4,17.4 L 28.7,28.7 A 16,16 0 0,0 24,40 Z" fill="#ffffff" />
                  {/* Perimeter Grab Rope */}
                  <circle cx="40" cy="40" r="35" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
                  {/* Flashing Emergency Beacon Light on Buoy Top */}
                  <circle cx="40" cy="8" r="4.5" fill="#ef4444" className="animate-ping" />
                  <circle cx="40" cy="8" r="3.5" fill="#fecaca" />
                  {/* Waterline Translucent Wash */}
                  <path d="M 8,46 Q 40,54 72,46 L 72,74 L 8,74 Z" fill="rgba(6, 182, 212, 0.4)" />
                </svg>
              </div>

              {/* Item 3: Floating Heavy Relief Supply Crate */}
              {effectiveSituation === 'flood' && (
                <div
                  className="absolute left-[54%] bottom-[36%] pointer-events-none animate-heavy-bob hidden md:block"
                  style={{ width: '60px', height: '48px', animationDelay: '0.8s' }}
                >
                  <svg viewBox="0 0 60 48" className="w-full h-full filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.8)]">
                    <rect x="4" y="8" width="52" height="34" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                    <rect x="8" y="12" width="44" height="26" fill="#334155" />
                    {/* Metal Straps */}
                    <line x1="20" y1="8" x2="20" y2="42" stroke="#94a3b8" strokeWidth="2.5" />
                    <line x1="40" y1="8" x2="40" y2="42" stroke="#94a3b8" strokeWidth="2.5" />
                    {/* Red Cross / Medical Relief Symbol */}
                    <rect x="27" y="21" width="6" height="8" fill="#ef4444" />
                    <rect x="25" y="23" width="10" height="4" fill="#ef4444" />
                    {/* Waterline */}
                    <path d="M 2,32 Q 30,38 58,32 L 58,46 L 2,46 Z" fill="rgba(6, 182, 212, 0.45)" />
                  </svg>
                </div>
              )}

              {/* Rising Underwater Air Bubbles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {bubbles.map(b => (
                  <div
                    key={b.id}
                    className="absolute bottom-2 rounded-full border border-cyan-200/60 bg-cyan-300/25 animate-bubble-rise"
                    style={{
                      left: `${b.left}%`,
                      width: `${b.size}px`,
                      height: `${b.size}px`,
                      animationDelay: `${b.delay}s`,
                      animationDuration: `${b.duration}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. REAL-TIME THUNDERSTORM LIGHTNING FLASH & PROCEDURAL BOLT FX            */}
      {/* ========================================================================= */}
      {isRaining && lightning.active && (
        <div className="fixed inset-0 pointer-events-none z-[12] overflow-hidden select-none">
          {/* Full-Screen Electric Atmosphere Lightning Flash */}
          <div
            className="absolute inset-0 transition-opacity"
            style={{
              opacity: lightning.intensity * 0.75,
              background: effectiveSituation === 'dual'
                ? 'linear-gradient(90deg, rgba(224, 242, 254, 0.65) 0%, rgba(186, 230, 253, 0.4) 45%, rgba(6, 182, 212, 0.1) 60%, transparent 100%)'
                : 'radial-gradient(ellipse at 50% 15%, rgba(240, 249, 255, 0.7) 0%, rgba(186, 230, 253, 0.45) 50%, rgba(6, 182, 212, 0.15) 100%)',
              mixBlendMode: 'screen',
              transition: lightning.intensity === 0 ? 'opacity 0.4s ease-out' : 'opacity 0.04s ease-in'
            }}
          />

          {/* Branching High-Voltage Lightning Bolt SVG */}
          {lightning.intensity > 0.1 && (
            <div
              className="absolute pointer-events-none overflow-visible filter drop-shadow-[0_0_20px_rgba(56,189,248,0.95)]"
              style={{
                left: `${lightning.boltLeft}%`,
                top: '0%',
                width: '320px',
                height: '500px',
                opacity: lightning.intensity,
                transform: 'translateY(-10px)'
              }}
            >
              <svg viewBox="0 0 320 500" fill="none" className="w-full h-full">
                <defs>
                  <filter id="lightningBoltGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Electric Cyan Corona / Outer Glow */}
                <path
                  d={LIGHTNING_BOLTS[lightning.boltIndex]}
                  stroke="#38bdf8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#lightningBoltGlow)"
                  opacity="0.85"
                />
                {/* Hyper-Intense White Core Filament */}
                <path
                  d={LIGHTNING_BOLTS[lightning.boltIndex]}
                  stroke="#ffffff"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="1"
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Fallback Floating Environment Pill only when parent doesn't provide controls */}
      {!onAtmosphereChange && (
        <div className="fixed top-2 sm:top-4 right-16 sm:right-20 lg:top-4 lg:right-64 z-50 pointer-events-auto select-none">
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-full px-2.5 py-1 shadow-2xl transition-all">
            {/* Active Hazard Regime Indicator Dot */}
            <div className="flex items-center gap-1.5 pr-1 border-r border-slate-700/80">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  effectiveSituation === 'flood'
                    ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse'
                    : effectiveSituation === 'drought'
                    ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse'
                    : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                }`}
              />
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-slate-300 hidden md:inline uppercase">
                {mode === 'auto' ? `Auto: ${effectiveSituation}` : effectiveSituation}
              </span>
            </div>

            {/* Quick Atmosphere Selector Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode('auto')}
                title="Automatic: React dynamically in real-time to game scenario preparedness scores"
                className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all ${
                  mode === 'auto'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Auto
              </button>

              <button
                onClick={() => setMode('dual')}
                title="Compound Hazard: RainAndDry.png gaming background"
                className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 ${
                  mode === 'dual'
                    ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Scale size={10} />
                <span className="hidden sm:inline">Dual</span>
              </button>

              <button
                onClick={() => setMode('flood')}
                title="Flood Situation: Flood.png background with heavy floating water and waves"
                className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 ${
                  mode === 'flood'
                    ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                }`}
              >
                <Waves size={10} />
                <span>Flood</span>
              </button>

              <button
                onClick={() => setMode('drought')}
                title="Drought Situation: Drought.png background with glowing earth cracks and heat haze"
                className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 ${
                  mode === 'drought'
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                }`}
              >
                <Sun size={10} />
                <span>Drought</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
