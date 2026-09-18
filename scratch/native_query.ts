import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI as string;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('sustain_tech');
  
  const teams = await db.collection('teams').find().toArray();
  const sessions = await db.collection('gamesessions').find().toArray();
  
  console.log(`Found ${teams.length} teams.`);
  console.log(`Found ${sessions.length} sessions.`);
  for (const s of sessions) {
    console.log(`Session ID: ${s._id}, Team ID: ${s.teamId}`);
  }
  
  await client.close();
}

run().catch(console.dir);
