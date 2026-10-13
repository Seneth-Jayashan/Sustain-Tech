'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─── SRT Data — exact timings from public/assets/intro/Video Project 5.srt ───
// Matched to narrator_v2.mp3 (new ElevenLabs Jax Meridian recording)
const SRT_DATA = `1
00:00:00,000 --> 00:00:08,000
10 days, one community, two possible futures. Floods threaten the highlands, drought threatens the dry zone.

2
00:00:09,000 --> 00:00:17,000
Rivers rise, roads collapse, water runs short. You do not know exactly what comes next. You are in

3
00:00:17,000 --> 00:00:24,000
command. Your treasury is limited. Your information incomplete and lives depend on your decisions.

4
00:00:25,000 --> 00:00:32,000
Rank your priorities. Only the top three execute. Allocate money, rescue vehicles,

5
00:00:32,000 --> 00:00:39,000
boats, and essential supplies. Act too late and danger spreads. Spend too quickly,

6
00:00:39,000 --> 00:00:45,000
and tomorrow's response may be impossible. Every choice changes what happens next.

7
00:00:45,000 --> 00:00:50,000
Your preparedness, your budget, your information, and your community's trust.

8
00:00:51,000 --> 00:01:00,000
There is no perfect answer. Only consequences. Observe. Assess. Prioritize. Act. Adapt.

9
00:01:00,000 --> 00:01:06,000
Sustain tech. 10 days to decide.`;

interface Subtitle {
  id: number;
  start: number;
  end: number;
  text: string;
}

const parseTime = (timeStr: string): number => {
  const [h, m, s] = timeStr.split(':');
  const [sec, ms] = s.split(',');
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(sec) + parseInt(ms) / 1000;
};

const parseSRT = (srt: string): Subtitle[] => {
  const blocks = srt.trim().split('\n\n');
  return blocks.map(block => {
    const lines = block.split('\n');
    const [startStr, endStr] = lines[1].split(' --> ');
    return {
      id: parseInt(lines[0]),
      start: parseTime(startStr.trim()),
      end: parseTime(endStr.trim()),
      text: lines.slice(2).join(' '),
    };
  });
};

// ─── Particle Component ───────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 4,
    delay: Math.random() * 5,
    color: i % 3 === 0 ? '#2dd4bf' : i % 3 === 1 ? '#3b82f6' : '#f59e0b',
    opacity: Math.random() * 0.6 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Rain Effect ──────────────────────────────────────────────────────────────
function RainEffect() {
  const drops = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    duration: Math.random() * 1.5 + 0.5,
    delay: Math.random() * 3,
    height: Math.random() * 20 + 10,
    opacity: Math.random() * 0.15 + 0.05,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {drops.map(d => (
        <motion.div
          key={d.id}
          className="absolute w-px"
          style={{
            left: `${d.x}%`,
            background: 'linear-gradient(to bottom, transparent, rgba(45, 212, 191, 0.6), transparent)',
            height: d.height,
            opacity: d.opacity,
          }}
          animate={{ y: ['-5%', '110%'] }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ─── Glitch Title ─────────────────────────────────────────────────────────────
function GlitchTitle({ text, trigger }: { text: string; trigger: boolean }) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [trigger]);

  return (
    <div className="relative select-none text-center px-2">
      <span
        className="block font-black text-transparent break-words"
        style={{
          fontSize: 'clamp(1.6rem, 6.5vw, 5.5rem)',
          fontFamily: "'Courier New', monospace",
          backgroundImage: 'linear-gradient(135deg, #fff 0%, #94a3b8 40%, #2dd4bf 70%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          letterSpacing: 'clamp(0.06em, 1.2vw, 0.22em)',
        }}
      >
        {text}
      </span>
      {glitch && (
        <>
          <span
            className="absolute inset-0 font-black text-transparent block break-words"
            style={{
              fontSize: 'clamp(1.6rem, 6.5vw, 5.5rem)',
              fontFamily: "'Courier New', monospace",
              backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 40%)',
              transform: 'translate(-2px, 1px)',
              letterSpacing: 'clamp(0.06em, 1.2vw, 0.22em)',
            }}
          >
            {text}
          </span>
          <span
            className="absolute inset-0 font-black text-transparent block break-words"
            style={{
              fontSize: 'clamp(1.6rem, 6.5vw, 5.5rem)',
              fontFamily: "'Courier New', monospace",
              backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)',
              transform: 'translate(2px, -1px)',
              letterSpacing: 'clamp(0.06em, 1.2vw, 0.22em)',
            }}
          >
            {text}
          </span>
        </>
      )}
    </div>
  );
}

// ─── Scan Line ────────────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <motion.div
      className="absolute inset-x-0 h-[2px] pointer-events-none z-20"
      style={{
        background:
          'linear-gradient(90deg, transparent, rgba(45,212,191,0.4), rgba(45,212,191,0.8), rgba(45,212,191,0.4), transparent)',
      }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ─── HUD Corners ──────────────────────────────────────────────────────────────
function HudCorners() {
  return (
    <>
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="w-8 h-8 border-t-2 border-l-2 border-teal-400/60" />
      </div>
      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="w-8 h-8 border-t-2 border-r-2 border-teal-400/60" />
      </div>
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="w-8 h-8 border-b-2 border-l-2 border-teal-400/60" />
      </div>
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className="w-8 h-8 border-b-2 border-r-2 border-teal-400/60" />
      </div>
    </>
  );
}

// ─── Audio Waveform ───────────────────────────────────────────────────────────
function AudioWaveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 32 }, (_, i) => i);
  return (
    <div className="flex items-center gap-[2px] h-8">
      {bars.map(i => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{ background: 'linear-gradient(to top, #2dd4bf, #3b82f6)' }}
          animate={
            active
              ? { height: [4, Math.random() * 28 + 4, 4], opacity: [0.4, 1, 0.4] }
              : { height: 4, opacity: 0.2 }
          }
          transition={{
            duration: 0.4 + Math.random() * 0.4,
            delay: i * 0.03,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Intro Page ──────────────────────────────────────────────────────────
export default function IntroPage() {
  const router = useRouter();
  const [subs] = useState<Subtitle[]>(parseSRT(SRT_DATA));
  const [currentText, setCurrentText] = useState('');
  const [phase, setPhase] = useState<'idle' | 'logo' | 'playing' | 'done'>('idle');
  const [showTitle, setShowTitle] = useState(false);
  const [statusText, setStatusText] = useState('SYSTEM READY');
  const [audioProgress, setAudioProgress] = useState(0);

  // Use AudioContext for bg music so we can loop it reliably without HTML loop glitches
  const narratorRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const bgFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number>(0);

  const skipIntro = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (bgFadeRef.current) clearInterval(bgFadeRef.current);
    router.push('/dashboard');
  }, [router]);

  // ── Reliable bg music loop via JS ended event ────────────────────────────
  const playBgMusic = useCallback((audio: HTMLAudioElement) => {
    audio.currentTime = 0;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        // Fade in
        let vol = 0;
        const fadeIn = setInterval(() => {
          vol = Math.min(vol + 0.015, 0.28);
          audio.volume = vol;
          if (vol >= 0.28) clearInterval(fadeIn);
        }, 80);
      })
      .catch(() => {});

    // Re-loop manually — avoids the HTML `loop` attribute stopping mid-track
    const onEnded = () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, []);

  const handleStart = useCallback(() => {
    setPhase('logo');
    setStatusText('INITIALIZING...');

    setTimeout(() => {
      setShowTitle(true);
      setStatusText('LOADING SCENARIO ENGINE...');
    }, 400);

    setTimeout(() => {
      setPhase('playing');
      setStatusText('BROADCAST ACTIVE');

      const narrator = narratorRef.current;
      const bgMusic = bgMusicRef.current;

      // Start bg music with JS-based loop
      if (bgMusic) playBgMusic(bgMusic);

      if (narrator) {
        narrator.volume = 1;
        narrator.play().catch(e => console.error('Narrator play error:', e));

        const updateSubs = () => {
          if (!narrator) return;
          const time = narrator.currentTime;
          const duration = narrator.duration || 1;
          setAudioProgress((time / duration) * 100);

          const active = subs.find(s => time >= s.start && time <= s.end);
          setCurrentText(active?.text ?? '');

          if (!narrator.ended) {
            rafRef.current = requestAnimationFrame(updateSubs);
          }
        };
        rafRef.current = requestAnimationFrame(updateSubs);

        narrator.addEventListener(
          'ended',
          () => {
            setPhase('done');
            setCurrentText('');
            setStatusText('SIMULATION READY');

            // Fade out bg music then navigate
            if (bgMusic) {
              let vol = bgMusic.volume;
              bgFadeRef.current = setInterval(() => {
                vol = Math.max(vol - 0.02, 0);
                bgMusic.volume = vol;
                if (vol <= 0) {
                  clearInterval(bgFadeRef.current!);
                  setTimeout(() => skipIntro(), 800);
                }
              }, 80);
            } else {
              setTimeout(() => skipIntro(), 1500);
            }
          },
          { once: true }
        );
      }
    }, 2200);
  }, [subs, skipIntro, playBgMusic]);

  // Cycling status texts in idle
  useEffect(() => {
    if (phase !== 'idle') return;
    const texts = [
      'SYSTEM READY',
      'SCENARIO ENGINE v2.6',
      'DISASTER SIM LOADED',
      'AWAITING COMMANDER...',
    ];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % texts.length;
      setStatusText(texts[i]);
    }, 1800);
    return () => clearInterval(id);
  }, [phase]);

  const isPlaying = phase === 'playing';

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#020810' }}>
      {/* Audio — no loop attr; looping handled via JS ended event */}
      <audio ref={narratorRef} src="/assets/intro/narrator_v2.mp3" preload="auto" />
      <audio ref={bgMusicRef} src="/assets/intro/Against_the_Rising_Tide.mp3" preload="auto" />

      {/* Deep background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(10,40,80,0.9) 0%, rgba(2,8,16,1) 100%)',
        }}
      />

      {/* Animated grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(45,212,191,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite',
        }}
      />

      <RainEffect />
      <Particles />
      <ScanLine />
      <HudCorners />

      {/* Top HUD bar */}
      <div className="absolute top-0 inset-x-0 h-10 flex items-center justify-between px-4 sm:px-8 md:px-16 border-b border-teal-400/10 bg-black/40 backdrop-blur-sm z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.div
            className="w-2 h-2 rounded-full bg-teal-400 shrink-0"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="font-mono text-[11px] sm:text-xs text-teal-400/80 tracking-wider sm:tracking-widest uppercase truncate max-w-[150px] sm:max-w-none">
            {statusText}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <span className="font-mono text-[10px] sm:text-xs text-slate-500 tracking-widest hidden sm:inline">
            SIM-2026 // LKA
          </span>
          <span className="font-mono text-[10px] sm:text-xs text-slate-400 font-bold">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>

      {/* Audio progress bar at bottom */}
      {isPlaying && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-900">
          <motion.div
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, #2dd4bf, #3b82f6)',
              width: `${audioProgress}%`,
            }}
          />
        </div>
      )}

      {/* Side lines */}
      <div className="absolute left-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-teal-400/20 to-transparent" />
      <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-teal-400/20 to-transparent" />

      {/* ── MAIN CONTENT ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 py-12 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-6 sm:gap-10 text-center max-w-2xl"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-teal-400/30 bg-teal-400/5"
              >
                <span className="text-teal-400 text-[10px] sm:text-xs font-mono tracking-widest uppercase">
                  Disaster Preparedness Simulation
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="w-full"
              >
                <GlitchTitle text="10 DAYS TO DECIDE" trigger={false} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-slate-400 font-mono text-xs sm:text-sm tracking-widest max-w-sm uppercase px-4 leading-relaxed"
              >
                One community. Two possible futures. Every decision matters.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="flex flex-col items-center gap-4 w-full px-4"
              >
                <motion.button
                  id="begin-broadcast-btn"
                  onClick={handleStart}
                  className="relative group px-8 sm:px-12 py-3.5 sm:py-4 font-mono font-bold tracking-widest uppercase text-xs sm:text-sm overflow-hidden w-full sm:w-auto"
                  style={{ border: '1px solid rgba(45, 212, 191, 0.6)', color: '#2dd4bf' }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'rgba(45, 212, 191, 0.08)' }} />
                  <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-teal-400" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-teal-400" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-teal-400" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-teal-400" />
                  <span className="relative z-10">⯈ BEGIN BROADCAST</span>
                </motion.button>
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="font-mono text-[10px] text-slate-500 tracking-widest uppercase"
                >
                  Tap to initialize audio
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* LOGO reveal */}
          {phase === 'logo' && (
            <motion.div
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 sm:gap-8 text-center px-4"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                className="w-full"
              >
                <GlitchTitle text="10 DAYS TO DECIDE" trigger={showTitle} />
              </motion.div>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                className="h-px max-w-2xl"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, #2dd4bf, #3b82f6, transparent)',
                }}
              />

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="font-mono text-[11px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] text-slate-500 uppercase"
              >
                SRI LANKA // NOVEMBER 2026
              </motion.p>

              <motion.div className="w-48 sm:w-64 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #2dd4bf, #3b82f6)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.8, ease: 'easeInOut' }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* PLAYING / DONE */}
          {(phase === 'playing' || phase === 'done') && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6 sm:gap-10 w-full max-w-4xl text-center px-2"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full"
              >
                <GlitchTitle text="10 DAYS TO DECIDE" trigger={isPlaying} />
              </motion.div>

              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <AudioWaveform active={isPlaying} />
                <span className="font-mono text-[9px] sm:text-[10px] text-teal-400/60 tracking-wider sm:tracking-widest uppercase">
                  {isPlaying ? 'JAX MERIDIAN // LIVE BROADCAST' : 'BROADCAST COMPLETE'}
                </span>
              </div>

              {/* Subtitle display */}
              <div className="min-h-24 sm:min-h-32 flex items-center justify-center w-full px-2 sm:px-4">
                <AnimatePresence mode="wait">
                  {currentText ? (
                    <motion.p
                      key={currentText}
                      initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
                      transition={{ duration: 0.3 }}
                      className="font-black leading-snug sm:leading-tight text-center max-w-3xl"
                      style={{
                        fontSize: 'clamp(1.15rem, 3.8vw, 3rem)',
                        fontFamily: "'Courier New', monospace",
                        backgroundImage:
                          'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {currentText}
                    </motion.p>
                  ) : isPlaying ? (
                    <motion.div
                      key="dots"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-2"
                    >
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-teal-400"
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 0.8, delay: i * 0.25, repeat: Infinity }}
                        />
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div
                    className="px-6 sm:px-8 py-2 font-mono text-xs sm:text-sm tracking-widest text-teal-400 uppercase"
                    style={{ border: '1px solid rgba(45,212,191,0.4)' }}
                  >
                    Entering Command Centre...
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Skip button */}
      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.button
            id="skip-intro-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
            onClick={skipIntro}
            className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 font-mono text-[11px] sm:text-xs tracking-widest text-slate-500 hover:text-teal-400 transition-colors z-30 uppercase flex items-center gap-1.5 sm:gap-2 bg-black/60 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg sm:rounded-none border border-slate-800 sm:border-0 backdrop-blur-sm sm:backdrop-blur-none"
          >
            <span>[ Skip Intro ]</span>
            <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
              ›
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes gridMove {
          0%   { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
      `}</style>
    </div>
  );
}
