import mongoose, { Schema, Document } from 'mongoose';
import { GameState, FinalResult } from '@/game/types';

export interface IGameSession extends Document {
  teamId: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'COMPLETED';
  state: GameState;
  finalResult?: FinalResult;
  startedAt: Date;
  updatedAt: Date;
}

const GameSessionSchema: Schema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'ACTIVE' },
  state: { type: Schema.Types.Mixed, required: true }, // Store full GameState as JSON
  finalResult: { type: Schema.Types.Mixed },
  startedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
GameSessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.GameSession || mongoose.model<IGameSession>('GameSession', GameSessionSchema);
