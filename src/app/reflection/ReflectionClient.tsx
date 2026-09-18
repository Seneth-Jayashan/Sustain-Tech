'use client';

import { motion } from 'framer-motion';
import { GameState, FinalResult } from '@/game/types';

interface Props {
  finalState: GameState;
  result: FinalResult;
  teamName: string;
}

export default function ReflectionClient({ finalState, result, teamName }: Props) {
  const { variables } = finalState;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-teal-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="glass-panel p-8 md:p-12 rounded-2xl max-w-4xl w-full"
    >
      <div className="text-center mb-12">
        <h1 className="text-sm tracking-[0.3em] uppercase text-gray-400 mb-4">Simulation Complete</h1>
        <h2 className="text-4xl md:text-5xl font-bold mb-2">Team {teamName}</h2>
        <div className="h-1 w-24 bg-[var(--color-sustain-accent)] mx-auto mt-6 rounded-full" />
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Left Col - Outcome */}
        <div className="space-y-8">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Actual Event Triggered</h3>
            <div className={`text-4xl font-bold font-mono ${result.pathway === 'Flood' ? 'text-blue-500' : 'text-orange-500'}`}>
              {result.pathway.toUpperCase()}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Final Preparedness Rating</h3>
            <div className={`text-3xl font-bold ${getScoreColor(result.cps)}`}>
              {result.rating.toUpperCase()}
            </div>
            <div className="text-sm text-gray-400 mt-2 font-mono">CPS Score: {result.cps.toFixed(2)} / 100</div>
          </div>

          <div className="bg-black/30 p-6 rounded-xl border border-gray-800">
            <p className="text-gray-300 italic">
              "Good decision-making is not the same as predicting the future. Your choices under uncertainty shaped this outcome."
            </p>
          </div>
        </div>

        {/* Right Col - Breakdown */}
        <div className="space-y-6">
          <h3 className="text-sm uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-2">Diagnostic Breakdown</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Flood Resilience</span>
              <span className={`font-mono font-bold ${getScoreColor(variables.F)}`}>{variables.F.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Drought Resilience</span>
              <span className={`font-mono font-bold ${getScoreColor(variables.D)}`}>{variables.D.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Resource Management</span>
              <span className={`font-mono font-bold ${getScoreColor(variables.R)}`}>{variables.R.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Information Quality</span>
              <span className={`font-mono font-bold ${getScoreColor(variables.I)}`}>{variables.I.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Community Trust</span>
              <span className={`font-mono font-bold ${getScoreColor(variables.C)}`}>{variables.C.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Decision Quality</span>
              <span className={`font-mono font-bold ${getScoreColor(variables.Q)}`}>{variables.Q.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
