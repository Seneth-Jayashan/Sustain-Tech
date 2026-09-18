import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import GameSession from './src/models/GameSession';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const sessions = await GameSession.find({}).lean();
  
  console.log('--- RAW SESSIONS (NO POPULATE) ---');
  for (const s of sessions) {
    console.log(`Session ID: ${s._id} | Team ID: ${s.teamId}`);
  }
  
  process.exit(0);
}

run();
