import mongoose, { Schema, Document } from 'mongoose';

export interface IIntegrityLog extends Document {
  gameSessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  actionType: 'VISIBILITY_CHANGE' | 'RIGHT_CLICK_ATTEMPT' | 'SUBMISSION';
  metadata?: any;
  createdAt: Date;
}

const IntegrityLogSchema: Schema = new Schema({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { 
    type: String, 
    enum: ['VISIBILITY_CHANGE', 'RIGHT_CLICK_ATTEMPT', 'SUBMISSION'], 
    required: true 
  },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.models.IntegrityLog || mongoose.model<IIntegrityLog>('IntegrityLog', IntegrityLogSchema);
