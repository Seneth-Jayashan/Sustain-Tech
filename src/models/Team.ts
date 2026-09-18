import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'player' | 'admin';
}

const TeamSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['player', 'admin'], default: 'player' },
});

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
