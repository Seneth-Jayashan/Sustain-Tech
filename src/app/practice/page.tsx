import { Metadata } from 'next';
import PracticeClient from './PracticeClient';

export const metadata: Metadata = {
  title: 'Practice Gaming Challenge | Sustain-Tech 2026',
  description: 'Practice strategic transit and urban planning challenge. Interactive decision sandbox with 3 policy scenarios, options analysis, and instant strategic debrief.',
};

export default function PracticePage() {
  return <PracticeClient />;
}
