// Simple audio context for UI sound effects (blips, pings)
let audioCtx: AudioContext | null = null;

function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playUIBlip() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

export function playRadarPing() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 1.0);
}

export function playWarningBeep(urgent = false) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Subtle acoustic sine reminder, avoiding harsh buzzers or loud alarms
  osc.type = 'sine';
  osc.frequency.setValueAtTime(urgent ? 520 : 440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(urgent ? 580 : 440, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(urgent ? 0.05 : 0.03, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

export function playTimeoutBuzzer() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  // Calm descending sine chime marking round conclusion without aggressive alarm
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(360, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

// Text-to-Speech wrapper with English voice selection and natural, slow pacing
let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (cachedVoices.length > 0) return cachedVoices;
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices || voices.length === 0) return null;

  // 1. High-priority natural English voices (en-US, en-GB)
  const preferredNames = [
    'Google UK English Female',
    'Google UK English Male',
    'Google US English',
    'Microsoft Libby Online (Natural)',
    'Microsoft Ryan Online (Natural)',
    'Samantha',
    'Daniel',
    'Serena',
    'Karen',
    'Fiona'
  ];

  for (const name of preferredNames) {
    const match = voices.find(v => v.name.includes(name));
    if (match) return match;
  }

  // 2. Exact match for standard en-US or en-GB
  const standardEn = voices.find(v => (
    v.lang === 'en-GB' || 
    v.lang === 'en-US' || 
    v.lang === 'en_GB' || 
    v.lang === 'en_US'
  ));
  if (standardEn) return standardEn;

  // 3. Graceful fallback to any English voice
  const anyEn = voices.find(v => v.lang.startsWith('en'));
  if (anyEn) return anyEn;

  // 4. Default voice
  return voices.find(v => v.default) || voices[0] || null;
}

export function speakText(text: string, interrupt = true) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  if (interrupt) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  const voice = getBestEnglishVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-US';
  }
  
  // Starting speech rate around 0.80–0.85 (0.82) for clear, deliberate disaster command briefing
  utterance.rate = 0.82;
  utterance.pitch = 1.0;
  
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

