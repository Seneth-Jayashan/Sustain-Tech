import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const TeamSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
});

const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in .env');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const email = 'team1@sustaintech.online';
  const password = 'Team1@systain';

  const existingTeam = await Team.findOne({ email });
  if (existingTeam) {
    console.log('Team already exists!');
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await Team.create({
      email,
      passwordHash,
      name: 'Team 1',
    });
    console.log('Created team successfully!');
  }

  await mongoose.disconnect();
}

main().catch(console.error);
