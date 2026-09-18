import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const TeamSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['player', 'admin'], default: 'player' },
});

const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in .env');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const teams = [
    { email: 'team1@sustaintech.online', password: 'Team1@systain', name: 'Team 1', role: 'player' },
    { email: 'admin@sustaintech.online', password: 'Admin@systain', name: 'Administrator', role: 'admin' }
  ];

  for (const t of teams) {
    const existing = await Team.findOne({ email: t.email });
    if (existing) {
      console.log(`Team ${t.email} already exists!`);
    } else {
      const passwordHash = await bcrypt.hash(t.password, 10);
      await Team.create({
        email: t.email,
        passwordHash,
        name: t.name,
        role: t.role,
      });
      console.log(`Created ${t.email} successfully!`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
