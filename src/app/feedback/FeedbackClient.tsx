'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  RefreshCcw,
  Mail,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  userSession: {
    name: string;
    email: string;
    teamName: string;
    role: string;
  } | null;
}

const RATING_DESCRIPTIONS: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: 'CRITICAL', color: 'text-red-400', desc: 'Severe balance or engagement deficiencies' },
  2: { label: 'SUBPAR', color: 'text-amber-400', desc: 'Difficulties overshadowed tactical gameplay' },
  3: { label: 'ADEQUATE', color: 'text-yellow-400', desc: 'Functional simulation with standard engagement' },
  4: { label: 'COMMENDABLE', color: 'text-cyan-400', desc: 'Strong strategic dilemmas & enjoyable flow' },
  5: { label: 'EXEMPLARY', color: 'text-emerald-400', desc: 'Superb climate combat & high immersion' },
};

export default function FeedbackClient({ userSession }: Props) {
  const [name, setName] = useState(userSession?.name || '');
  const [email, setEmail] = useState(userSession?.email || '');
  const [teamName, setTeamName] = useState(userSession?.teamName || '');
  const [isAutoFetched, setIsAutoFetched] = useState(Boolean(userSession?.email));
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    // If email is not passed via props (e.g. client navigation or session without cookie email), fetch from /api/auth/me
    if (!email || !name) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data?.authenticated && data.user) {
            if (!email && data.user.email) {
              setEmail(data.user.email);
              setIsAutoFetched(true);
            }
            if (!name && data.user.name) {
              setName(data.user.name);
            }
            if (!teamName && data.user.teamName) {
              setTeamName(data.user.teamName);
            }
          }
        })
        .catch(() => {});
    } else {
      setIsAutoFetched(true);
    }
  }, [email, name, teamName]);

  const [gameGoods, setGameGoods] = useState('');
  const [gameBads, setGameBads] = useState('');
  const [improvements, setImprovements] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Operative Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid operative contact email is required');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          teamName: teamName.trim(),
          rating,
          gameGoods: gameGoods.trim(),
          gameBads: gameBads.trim(),
          improvements: improvements.trim(),
          additionalComments: additionalComments.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || 'Failed to transmit feedback');
      }
    } catch {
      setErrorMsg('Network error transmitting debrief. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#040806] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black relative overflow-x-hidden">
      {/* Background Ambience Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-emerald-500/10 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-cyan-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Top HUD Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#070d0a]/90 backdrop-blur-md border-b border-emerald-950/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href={userSession ? '/dashboard' : '/'}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Return to {userSession ? 'Dashboard' : 'Home'}</span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="hidden sm:inline-block text-slate-500">// SYS.FEEDBACK: DISPATCH DESK</span>
            <a
              href="mailto:support@sustaintech.online"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-900/60 rounded-full text-[11px] text-slate-300 hover:text-white hover:border-emerald-500/60 transition-all"
            >
              <HelpCircle size={12} className="text-emerald-400" />
              <span>Need Support?</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <AnimatePresence mode="wait">
          {submitted ? (
            /* Success Transmission Screen */
            <motion.div
              key="submitted-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-b from-[#0b1410] to-[#060a08] border-2 border-emerald-500/60 rounded-2xl p-6 sm:p-12 text-center shadow-[0_0_60px_rgba(16,185,129,0.2)] space-y-6"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <CheckCircle2 size={38} />
              </div>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Transmission Acknowledged
                </div>
                <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-wide">
                  Mission Debrief <span className="text-emerald-400">Logged</span>
                </h2>
                <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Thank you, Operative <strong>{name}</strong>. Your feedback has been forwarded directly to{' '}
                  <span className="text-emerald-300 font-mono">feedback@sustaintech.online</span>. A confirmation dispatch
                  has also been sent to your email (<span className="text-blue-300 font-mono">{email}</span>).
                </p>
              </div>

              {/* Support Notice Card */}
              <div className="bg-black/50 border border-emerald-950 rounded-xl p-4 max-w-lg mx-auto text-xs font-mono text-slate-400">
                <p>
                  Need immediate tactical assistance or encounter a tournament issue? Email Central Command at{' '}
                  <a href="mailto:support@sustaintech.online" className="text-emerald-400 font-bold underline">
                    support@sustaintech.online
                  </a>
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                {userSession ? (
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  >
                    Return to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  >
                    Return to Home
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setGameGoods('');
                    setGameBads('');
                    setImprovements('');
                    setAdditionalComments('');
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-slate-800 rounded-xl font-mono text-xs uppercase tracking-wider transition-all"
                >
                  Submit Another Report
                </button>
              </div>
            </motion.div>
          ) : (
            /* Feedback Input Form */
            <motion.div
              key="form-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Header Banner */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  <ShieldCheck size={13} />
                  // OPERATIVE EVALUATION &amp; DEBRIEF //
                </div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                  MISSION <span className="text-emerald-400">FEEDBACK</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  Every decision matters in crisis resilience. Share your gameplay impressions, operational pain points, and
                  strategic ideas directly with Central Command.
                </p>
              </div>

              {/* Form Container */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2.5">
                    <AlertCircle size={16} className="shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 1. Operative Identity Card */}
                <div className="bg-[#0a120d] border border-emerald-950 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                      1. Operative Identity
                    </span>
                    {userSession && (
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        Authenticated via Session
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold">
                          Operative Name *
                        </label>
                        {name && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 size={11} className="text-emerald-400" />
                            Logged In
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Mason"
                        className="w-full bg-black/60 border border-emerald-950/80 focus:border-emerald-500 rounded-xl p-3 text-sm font-mono text-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold">
                          Login Email *
                        </label>
                        {email && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 size={11} className="text-emerald-400" />
                            Auto-Fetched
                          </span>
                        )}
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setIsAutoFetched(false);
                        }}
                        placeholder="operative@email.com"
                        className={`w-full bg-black/60 border rounded-xl p-3 text-sm font-mono text-white focus:outline-none transition-all ${
                          email
                            ? 'border-emerald-500/50 bg-emerald-950/10 focus:border-emerald-400'
                            : 'border-emerald-950/80 focus:border-emerald-500'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold">
                          Squad / Team Name
                        </label>
                        {teamName && (
                          <span className="text-[10px] font-mono text-teal-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 size={11} className="text-teal-400" />
                            Squad Linked
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Alpha Vanguard"
                        className="w-full bg-black/60 border border-emerald-950/80 focus:border-emerald-500 rounded-xl p-3 text-sm font-mono text-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Overall Simulation Rating */}
                <div className="bg-[#0a120d] border border-emerald-950 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                      2. Overall Simulation Rating *
                    </span>
                    <span className={`text-xs font-mono font-black ${RATING_DESCRIPTIONS[activeRating]?.color || 'text-emerald-400'}`}>
                      {RATING_DESCRIPTIONS[activeRating]?.label} ({activeRating} / 5)
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 py-2">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = starVal <= activeRating;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1.5 hover:scale-125 transition-transform cursor-pointer"
                            title={`Rate ${starVal} Star(s)`}
                          >
                            <Star
                              size={32}
                              className={`transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                                  : 'text-slate-700'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-xs font-mono text-slate-400 text-center sm:text-right">
                      {RATING_DESCRIPTIONS[activeRating]?.desc}
                    </p>
                  </div>
                </div>

                {/* 3. Game Goods (What Went Well) */}
                <div className="bg-[#0a120d] border border-emerald-950 rounded-2xl p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <ThumbsUp size={16} />
                    <label className="text-xs font-mono font-bold uppercase tracking-wider">
                      What went well? (Game Goods)
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Which scenarios, game mechanics, strategy dilemmas, or visualizations felt most engaging and fun?
                  </p>
                  <textarea
                    rows={3}
                    value={gameGoods}
                    onChange={(e) => setGameGoods(e.target.value)}
                    placeholder="e.g. The multi-hazard trade-offs between Kelani flooding and dry-zone irrigation were intense and realistic. The UI timer made decisions feel high-stakes..."
                    className="w-full bg-black/60 border border-emerald-950/80 focus:border-emerald-500 rounded-xl p-3 text-sm font-mono text-white focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* 4. Game Bads (Pain Points & Difficulties) */}
                <div className="bg-[#0a120d] border border-emerald-950 rounded-2xl p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <ThumbsDown size={16} />
                    <label className="text-xs font-mono font-bold uppercase tracking-wider">
                      What was difficult or frustrating? (Game Bads)
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Did you experience confusion, pacing friction, strict timers, bugs, or unclear indicator effects?
                  </p>
                  <textarea
                    rows={3}
                    value={gameBads}
                    onChange={(e) => setGameBads(e.target.value)}
                    placeholder="e.g. The first round timer felt a bit fast before we could read all 3 directive cards. It was difficult to predict emergency budget penalties..."
                    className="w-full bg-black/60 border border-emerald-950/80 focus:border-red-500 rounded-xl p-3 text-sm font-mono text-white focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* 5. Areas for Improvement */}
                <div className="bg-[#0a120d] border border-emerald-950 rounded-2xl p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Lightbulb size={16} />
                    <label className="text-xs font-mono font-bold uppercase tracking-wider">
                      Suggestions &amp; Improvements
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    What features, tools, graphs, or new scenarios would you like to see added in future tournament seasons?
                  </p>
                  <textarea
                    rows={3}
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="e.g. Add a real-time squad chat or live vote tally so team members can debate before locking in a decision. More agricultural drought scenarios..."
                    className="w-full bg-black/60 border border-emerald-950/80 focus:border-cyan-500 rounded-xl p-3 text-sm font-mono text-white focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* 6. General Comments */}
                <div className="bg-[#0a120d] border border-emerald-950 rounded-2xl p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <MessageSquare size={16} />
                    <label className="text-xs font-mono font-bold uppercase tracking-wider">
                      Additional Thoughts / General Comments
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    placeholder="Any closing thoughts for the Sustain Tech development squad..."
                    className="w-full bg-black/60 border border-emerald-950/80 focus:border-purple-500 rounded-xl p-3 text-sm font-mono text-white focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* Support Direct Contact Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-black/50 border border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={16} className="text-emerald-400 shrink-0" />
                    <span>Need immediate technical or tournament support?</span>
                  </div>
                  <a
                    href="mailto:support@sustaintech.online"
                    className="text-emerald-400 font-bold hover:underline shrink-0"
                  >
                    support@sustaintech.online
                  </a>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-black font-mono text-sm uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] cursor-pointer active:scale-98 flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <>
                        <RefreshCcw size={18} className="animate-spin" />
                        <span>Transmitting Debrief to Command...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Transmit Mission Debrief [Submit]</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
