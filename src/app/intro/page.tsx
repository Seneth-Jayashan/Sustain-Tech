'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const SRT_DATA = `1
00:00:00,070 --> 00:00:02,990
10 days, one community, two

2
00:00:02,990 --> 00:00:05,910
possible futures. Floods or drought?

3
00:00:06,590 --> 00:00:09,331
You don't know what will

4
00:00:09,331 --> 00:00:12,071
happen, your resources are limited,

5
00:00:12,071 --> 00:00:14,812
your information is incomplete, and

6
00:00:14,812 --> 00:00:17,552
every decision changes what comes

7
00:00:17,552 --> 00:00:20,293
next. There is no perfect

8
00:00:20,293 --> 00:00:22,485
answer, only consequences. Observe,

9
00:00:22,485 --> 00:00:25,226
assess, prioritize, act, Adapt. 10

10
00:00:25,226 --> 00:00:28,190
days to decide. Good

11
00:00:28,190 --> 00:00:30,175
luck.`;

interface Subtitle {
  id: number;
  start: number;
  end: number;
  text: string;
}

const parseTime = (timeStr: string) => {
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
      start: parseTime(startStr),
      end: parseTime(endStr),
      text: lines.slice(2).join(' ')
    };
  });
};

export default function IntroPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subtitle[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [started, setStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSubs(parseSRT(SRT_DATA));
  }, []);

  const handleStart = () => {
    setStarted(true);
    
    // Play both audio tracks
    if (audioRef.current && bgMusicRef.current) {
      bgMusicRef.current.volume = 0.3; // Lower volume for background music
      bgMusicRef.current.play().catch(e => console.error(e));
      
      audioRef.current.play().catch(e => console.error(e));
      
      const updateSubtitles = () => {
        if (!audioRef.current) return;
        const time = audioRef.current.currentTime;
        
        const activeSub = subs.find(s => time >= s.start && time <= s.end);
        if (activeSub) {
          setCurrentText(activeSub.text);
        } else {
          setCurrentText('');
        }
        
        requestAnimationFrame(updateSubtitles);
      };
      requestAnimationFrame(updateSubtitles);
    }
  };

  const skipIntro = () => {
    router.push('/dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Hidden Audio Elements */}
      <audio 
        ref={audioRef} 
        src="/assets/intro/ElevenLabs_2026-09-21T07_58_48_Jax Meridian - Rich and Deep Storyteller_pvc_sp90_s75_sb75_se40_b_m2.mp3" 
        onEnded={skipIntro}
      />
      <audio 
        ref={bgMusicRef} 
        src="/assets/intro/Against_the_Rising_Tide.mp3" 
      />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.5)_2px,transparent_2px),linear-gradient(90deg,rgba(15,23,42,0.5)_2px,transparent_2px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>

      <AnimatePresence>
        {!started ? (
          <motion.div 
            exit={{ opacity: 0, scale: 0.9 }}
            className="z-10 flex flex-col items-center"
          >
            <h1 className="text-2xl font-black font-mono tracking-widest text-blue-500 mb-8">INITIALIZING SIMULATION...</h1>
            <button 
              onClick={handleStart}
              className="px-8 py-4 bg-transparent border-2 border-blue-500 text-blue-400 font-bold tracking-widest uppercase rounded hover:bg-blue-500/20 transition-all hover:scale-105"
            >
              Begin Broadcast
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="z-10 flex flex-col items-center justify-center w-full max-w-4xl px-8 h-64 text-center"
          >
            <AnimatePresence mode="wait">
              {currentText && (
                <motion.p
                  key={currentText}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl md:text-5xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 leading-tight"
                >
                  {currentText}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={skipIntro}
        className="absolute bottom-8 right-8 text-gray-500 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors z-20"
      >
        [ Skip Intro ]
      </button>
    </div>
  );
}
