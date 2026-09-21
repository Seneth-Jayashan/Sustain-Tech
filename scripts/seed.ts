import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { getInitialState } from '../src/game/engine'; // We need this to mock sessions

dotenv.config({ path: '.env' });

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  role: { type: String, enum: ['player', 'admin'], default: 'player' },
}, { timestamps: true });

const GameSessionSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  currentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'ACTIVE' },
  state: { type: mongoose.Schema.Types.Mixed, required: true },
  finalResult: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const GameSession = mongoose.models.GameSession || mongoose.model('GameSession', GameSessionSchema);

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in .env');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Define Teams
  const teamData = [
    { name: 'Team 1', isPlayer: true },
    { name: 'Admin Team', isPlayer: false },
    { name: 'Team Alpha', isPlayer: true },
    { name: 'Team Beta', isPlayer: true },
    { name: 'Team Gamma', isPlayer: true }
  ];

  const createdTeams: Record<string, any> = {};

  for (const t of teamData) {
    let team = await Team.findOne({ name: t.name });
    if (!team) {
      team = await Team.create({ name: t.name });
      console.log(`Created Team: ${t.name}`);
    }
    createdTeams[t.name] = team;
  }

  // Define Users
  const users = [
    // Team 1 Members
    { email: 'team1@sustaintech.online', password: 'Team1@systain', name: 'T1 Member A', teamName: 'Team 1', role: 'player' },
    { email: 'team1_b@sustaintech.online', password: 'password', name: 'T1 Member B', teamName: 'Team 1', role: 'player' },
    
    // Admin
    { email: 'admin@sustaintech.online', password: 'Admin@systain', name: 'Administrator', teamName: 'Admin Team', role: 'admin' },
    
    // Team Alpha Members
    { email: 'team2@sustaintech.online', password: 'password', name: 'Alpha Member A', teamName: 'Team Alpha', role: 'player' },
    
    // Team Beta Members
    { email: 'team3@sustaintech.online', password: 'password', name: 'Beta Member A', teamName: 'Team Beta', role: 'player' },
    
    // Team Gamma Members
    { email: 'team4@sustaintech.online', password: 'password', name: 'Gamma Member A', teamName: 'Team Gamma', role: 'player' }
  ];

  for (const u of users) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      user = await User.create({
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        teamId: createdTeams[u.teamName]._id
      });
      console.log(`Created User: ${u.email}`);
    }

    // Generate mock game sessions for the new teams so Admin has telemetry
    if (u.role === 'player' && u.teamName !== 'Team 1') {
      const existingSession = await GameSession.findOne({ teamId: createdTeams[u.teamName]._id });
      if (!existingSession) {
        const state = getInitialState();
        
        // Mutate state to look like they are mid-game
        if (u.teamName === 'Team Alpha') {
          state.currentDay = 5;
          state.budget = 60000;
          state.variables.C = 85;
          await GameSession.create({ teamId: createdTeams[u.teamName]._id, currentUserId: user._id, status: 'ACTIVE', state });
        } else if (u.teamName === 'Team Beta') {
          state.currentDay = 8;
          state.budget = 20000;
          state.variables.C = 60;
          await GameSession.create({ 
            teamId: createdTeams[u.teamName]._id, 
            currentUserId: user._id,
            status: 'COMPLETED', 
            state, 
            finalResult: { cps: 82, pathway: 'Flood', rating: 'Good' } 
          });
        } else if (u.teamName === 'Team Gamma') {
          state.currentBucket = 2;
          state.currentDay = 2;
          state.budget = 420000;
          state.variables.C = 30; // low trust
          await GameSession.create({ teamId: createdTeams[u.teamName]._id, currentUserId: user._id, status: 'ACTIVE', state });
        }
        console.log(`Created mock telemetry for ${u.teamName}`);
      }
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
