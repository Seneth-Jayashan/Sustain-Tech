import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import GameSession from './src/models/GameSession';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected. Dropping gamesessions...');
  await GameSession.collection.drop().catch(() => console.log('Collection already empty or not found'));
  console.log('Dropped gamesessions.');
  process.exit(0);
}

run();
