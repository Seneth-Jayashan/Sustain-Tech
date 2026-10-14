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

// Automatically drop legacy email index if present from historical schema once connection is established
if (typeof window === 'undefined') {
  if (mongoose.connection.readyState === 1) {
    Team.collection.dropIndex('email_1').catch(() => {});
  } else {
    mongoose.connection.once('connected', () => {
      Team.collection.dropIndex('email_1').catch(() => {});
    });
  }
}

export default Team;
