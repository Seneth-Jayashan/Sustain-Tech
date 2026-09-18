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
}, { timestamps: true });

export default mongoose.models.GameSession || mongoose.model<IGameSession>('GameSession', GameSessionSchema);
