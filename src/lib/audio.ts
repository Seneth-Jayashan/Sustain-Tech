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
  
  utterance.rate = 0.82;
  utterance.pitch = 1.0;
  
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === 'undefined') return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  stopScenarioAudio();
}

/**
 * Authentic Scenario Voice Recordings
 * Maps each scenario Day (0, 2, 4, 6, 8, 10) to its recorded scenario audio file in /scenario/
 */
export const SCENARIO_AUDIO_MAP: Record<number, { title: string; filename: string; src: string }> = {
  0: {
    title: 'Day 0: Early Warning and Uncertainty',
    filename: 'Day 0: Early Warning and Uncertainty.mp3',
    src: '/scenario/Day 0: Early Warning and Uncertainty.mp3'
  },
  2: {
    title: 'Day 2: Compound Hazard',
    filename: 'Day 2: Compound Hazard.mp3',
    src: '/scenario/Day 2: Compound Hazard.mp3'
  },
  4: {
    title: 'Day 4: Allocating LKR 100M Against LKR 120M of Needs',
    filename: 'Day 4: Allocating LKR 100M Against LKR 120M of Needs.mp3',
    src: '/scenario/Day 4: Allocating LKR 100M Against LKR 120M of Needs.mp3'
  },
  6: {
    title: 'Day 6: Trucks, Rescue Vehicles and Boats',
    filename: 'Day 6: Trucks, Rescue Vehicles and Boats.mp3',
    src: '/scenario/Day 6: Trucks, Rescue Vehicles and Boats.mp3'
  },
  8: {
    title: 'Day 8: Landslides, Blocked Roads, Telecom Failure and Dry-Zone Shortage',
    filename: 'Day 8: Landslides, Blocked Roads, Telecom Failure and Dry-Zone Shortage.mp3',
    src: '/scenario/Day 8: Landslides, Blocked Roads, Telecom Failure and Dry-Zone Shortage.mp3'
  },
  10: {
    title: 'Day 10: From Emergency Response to Recovery',
    filename: 'Day 10: From Emergency Response to Recovery.mp3',
    src: '/scenario/Day 10: From Emergency Response to Recovery.mp3'
  }
};

let currentScenarioAudio: HTMLAudioElement | null = null;
let currentScenarioDay: number | null = null;
let progressCallback: ((currentTime: number, duration: number) => void) | null = null;
let endedCallback: (() => void) | null = null;
let stateChangeCallback: ((isPlaying: boolean) => void) | null = null;

export function getScenarioAudioConfig(day: number) {
  return SCENARIO_AUDIO_MAP[day] || null;
}

export function playScenarioAudio(
  day: number,
  callbacks?: {
    onProgress?: (currentTime: number, duration: number) => void;
    onEnded?: () => void;
    onStateChange?: (isPlaying: boolean) => void;
    onError?: (error: Error) => void;
  }
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  // Stop any active speech synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  const audioConfig = getScenarioAudioConfig(day);
  if (!audioConfig) {
    const err = new Error(`No scenario audio recording available for Day ${day}`);
    callbacks?.onError?.(err);
    return Promise.reject(err);
  }

  // If same audio is currently paused, resume it
  if (currentScenarioAudio && currentScenarioDay === day && currentScenarioAudio.paused) {
    return currentScenarioAudio.play().then(() => {
      callbacks?.onStateChange?.(true);
    }).catch(err => {
      callbacks?.onError?.(err);
    });
  }

  // Stop previous audio
  stopScenarioAudio();

  progressCallback = callbacks?.onProgress || null;
  endedCallback = callbacks?.onEnded || null;
  stateChangeCallback = callbacks?.onStateChange || null;

  const audio = new Audio(audioConfig.src);
  currentScenarioAudio = audio;
  currentScenarioDay = day;

  audio.preload = 'auto';

  audio.ontimeupdate = () => {
    if (progressCallback && audio) {
      progressCallback(audio.currentTime, audio.duration || 0);
    }
  };

  audio.onended = () => {
    if (stateChangeCallback) stateChangeCallback(false);
    if (endedCallback) endedCallback();
  };

  audio.onpause = () => {
    if (stateChangeCallback) stateChangeCallback(false);
  };

  audio.onplay = () => {
    if (stateChangeCallback) stateChangeCallback(true);
  };

  audio.onerror = () => {
    const err = new Error(`Unable to load scenario audio: ${audioConfig.filename}`);
    if (callbacks?.onError) callbacks.onError(err);
  };

  return audio.play().catch(err => {
    // Autoplay restrictions or network failure
    if (callbacks?.onError) callbacks.onError(err);
  });
}

export function pauseScenarioAudio() {
  if (currentScenarioAudio && !currentScenarioAudio.paused) {
    currentScenarioAudio.pause();
    if (stateChangeCallback) stateChangeCallback(false);
  }
}

export function resumeScenarioAudio(): Promise<void> {
  if (currentScenarioAudio && currentScenarioAudio.paused) {
    return currentScenarioAudio.play().then(() => {
      if (stateChangeCallback) stateChangeCallback(true);
    });
  }
  return Promise.resolve();
}

export function stopScenarioAudio() {
  if (currentScenarioAudio) {
    try {
      currentScenarioAudio.pause();
      currentScenarioAudio.currentTime = 0;
      currentScenarioAudio.src = '';
    } catch {}
    currentScenarioAudio = null;
    currentScenarioDay = null;
    if (stateChangeCallback) stateChangeCallback(false);
  }
}

export function seekScenarioAudio(seconds: number) {
  if (currentScenarioAudio && isFinite(seconds)) {
    currentScenarioAudio.currentTime = Math.max(0, Math.min(seconds, currentScenarioAudio.duration || seconds));
  }
}

export function getScenarioAudioState(): { isPlaying: boolean; day: number | null; currentTime: number; duration: number } {
  if (!currentScenarioAudio) {
    return { isPlaying: false, day: null, currentTime: 0, duration: 0 };
  }
  return {
    isPlaying: !currentScenarioAudio.paused,
    day: currentScenarioDay,
    currentTime: currentScenarioAudio.currentTime || 0,
    duration: currentScenarioAudio.duration || 0
  };
}

