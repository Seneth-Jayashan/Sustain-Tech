import { Metadata } from 'next';
import PracticeClient from './PracticeClient';

export const metadata: Metadata = {
  title: 'Practice Gaming Challenge | Sustain-Tech 2026',
  description: 'Practice climate disaster preparedness challenge. Client-side local storage simulation with 3-day tactical drill, resource allocation, and instant performance debrief.',
};

export default function PracticePage() {
  return <PracticeClient />;
}
