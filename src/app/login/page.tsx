'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
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
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center relative overflow-hidden p-4 sm:p-6">
      {/* Background Animated Elements */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[50%] sm:w-[40%] h-[50%] sm:h-[40%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[50%] sm:w-[40%] h-[50%] sm:h-[40%] bg-teal-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-panel p-6 sm:p-8 rounded-2xl w-full max-w-md z-10 shadow-2xl border border-teal-500/20"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          {/* Symposium Official Branding (Logo + Banner) */}
          <div className="flex items-center gap-2.5 mb-3.5">
            {/* <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/95 p-1 shadow-lg border border-teal-500/30 flex items-center justify-center shrink-0">
              <Image 
                src="/assets/images/Logo.jpg" 
                alt="Symposium Logo" 
                fill 
                className="object-contain" 
                priority 
                unoptimized 
              />
            </div> */}
            <div className="relative h-10 w-44 sm:w-52 overflow-hidden rounded-xl bg-white/95 px-2 shadow-lg border border-teal-500/30 flex items-center justify-center">
              <Image
                src="/assets/images/Banner.jpg"
                alt="Annual Research Symposium 2026"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1"
          >
            SustainTech
          </motion.h1>
          <p className="text-teal-400/80 text-xs tracking-[0.25em] uppercase font-mono">10 Days to Decide</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Team Identifier</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
              placeholder="team@sustaintech.online"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Access Code</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md p-3"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-lg px-4 py-3 transition-colors uppercase tracking-wider text-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Initialize Simulation'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
