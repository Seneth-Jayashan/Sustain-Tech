import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TeamSchema: Schema = new Schema({
  name: { type: String, required: true },
}, { timestamps: true });

const Team = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

// Automatically drop legacy email index if present from historical schema
if (mongoose.connection) {
  Team.collection.dropIndex('email_1').catch(() => {});
}

export default Team;
