import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import GameSession from './src/models/GameSession';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  // Update the ghost session to belong to the new Team 1
  const result = await GameSession.updateOne(
    { _id: '6aad9dc7ae5750ea5fa0be72' }, // The ghost session
    { $set: { teamId: '6aad998deef9b8e57bfaeead' } } // The real Team 1
  );
  
  console.log(`Updated ${result.modifiedCount} sessions to belong to Team 1.`);
  process.exit(0);
}

run();
