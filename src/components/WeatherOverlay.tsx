'use client';

import { motion } from 'framer-motion';

interface Props {
  floodScore: number;
  droughtScore: number;
}

export default function WeatherOverlay({ floodScore, droughtScore }: Props) {
  // Determine dominant weather risk
  const isFloodRisk = floodScore > droughtScore && floodScore > 10;
  const isDroughtRisk = droughtScore > floodScore && droughtScore > 10;
  
  // Calculate intensity (max 100)
  const intensity = isFloodRisk ? Math.min(floodScore, 100) / 100 : Math.min(droughtScore, 100) / 100;

  if (!isFloodRisk && !isDroughtRisk) {
    return null;
  }

  if (isFloodRisk) {
    // Generate rain drops
    const drops = Array.from({ length: Math.floor(20 + intensity * 80) });
    return (
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-40">
        {drops.map((_, i) => {
          const x = Math.random() * 100;
          const delay = Math.random() * 2;
          const duration = 0.5 + Math.random() * 0.5;
          return (
            <motion.div
              key={`rain-${i}`}
              initial={{ y: -20, x: `${x}vw`, opacity: 0 }}
              animate={{ y: '100vh', opacity: [0, 1, 0] }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-0 w-0.5 h-12 bg-blue-300 blur-[1px]"
            />
          );
        })}
      </div>
    );
  }

  if (isDroughtRisk) {
    return (
      <motion.div
        className="fixed inset-0 pointer-events-none z-[-1] bg-orange-500/10"
        style={{ backdropFilter: 'sepia(50%) hue-rotate(15deg)' }}
        animate={{
          opacity: [0.1 * intensity, 0.3 * intensity, 0.1 * intensity],
          scale: [1, 1.02, 1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-400/20 via-transparent to-transparent opacity-60"></div>
      </motion.div>
    );
  }

  return null;
}
