import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { getInitialState } from '../src/game/engine'; // We need this to mock sessions

dotenv.config({ path: '.env' });

const TeamSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['player', 'admin'], default: 'player' },
});

const GameSessionSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'ACTIVE' },
  state: { type: mongoose.Schema.Types.Mixed, required: true },
  finalResult: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const GameSession = mongoose.models.GameSession || mongoose.model('GameSession', GameSessionSchema);

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in .env');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const teams = [
    { email: 'team1@sustaintech.online', password: 'Team1@systain', name: 'Team 1', role: 'player' },
    { email: 'admin@sustaintech.online', password: 'Admin@systain', name: 'Administrator', role: 'admin' },
    { email: 'team2@sustaintech.online', password: 'password', name: 'Team Alpha', role: 'player' },
    { email: 'team3@sustaintech.online', password: 'password', name: 'Team Beta', role: 'player' },
    { email: 'team4@sustaintech.online', password: 'password', name: 'Team Gamma', role: 'player' }
  ];

  for (const t of teams) {
    let team = await Team.findOne({ email: t.email });
    if (team) {
      console.log(`Team ${t.email} already exists!`);
    } else {
      const passwordHash = await bcrypt.hash(t.password, 10);
      team = await Team.create({
        email: t.email,
        passwordHash,
        name: t.name,
        role: t.role,
      });
      console.log(`Created ${t.email} successfully!`);
    }

    // Generate mock game sessions for the new teams so Admin has telemetry
    if (t.role === 'player' && t.email !== 'team1@sustaintech.online') {
      const existingSession = await GameSession.findOne({ teamId: team._id });
      if (!existingSession) {
        const state = getInitialState();
        
        // Mutate state to look like they are mid-game
        if (t.name === 'Team Alpha') {
          state.currentBucket = 3;
          state.currentDay = 4;
          state.budget = 250000;
          state.waterStorage = 3000;
          state.variables.I = 75;
          await GameSession.create({ teamId: team._id, status: 'ACTIVE', state });
        } else if (t.name === 'Team Beta') {
          state.currentBucket = 6;
          state.currentDay = 10;
          state.budget = 10000;
          state.waterStorage = 500;
          await GameSession.create({ 
            teamId: team._id, 
            status: 'COMPLETED', 
            state, 
            finalResult: { cps: 82, pathway: 'Flood', rating: 'Good' } 
          });
        } else if (t.name === 'Team Gamma') {
          state.currentBucket = 2;
          state.currentDay = 2;
          state.budget = 420000;
          state.variables.C = 30; // low trust
          await GameSession.create({ teamId: team._id, status: 'ACTIVE', state });
        }
        console.log(`Created mock telemetry for ${t.name}`);
      }
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
