import mongoose, { Schema, Document } from 'mongoose';

export type IntegrityActionType = 
  | 'VISIBILITY_CHANGE' 
  | 'WINDOW_BLUR'
  | 'WINDOW_FOCUS'
  | 'RIGHT_CLICK_ATTEMPT' 
  | 'COPY_PASTE_ATTEMPT'
  | 'RECONNECT'
  | 'REPEATED_REQUEST'
  | 'DEADLINE_MANIPULATION_ATTEMPT'
  | 'UNUSUAL_SUBMISSION_PATTERN'
  | 'INVALID_SUBMISSION_ATTEMPT'
  | 'SUBMISSION' 
  | 'TIMEOUT_FALLBACK_SUBMISSION'
  | 'TIMEOUT_SUBMISSION'
  | 'OVERTIME_SUBMISSION'
  | 'FALLBACK_ACKNOWLEDGEMENT';

export type IntegritySeverity = 'info' | 'review_signal' | 'high_priority';

export interface IIntegrityLog extends Document {
  gameSessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName?: string;
  teamId?: mongoose.Types.ObjectId;
  round?: number;
  day?: number;
  actionType: IntegrityActionType;
  severity: IntegritySeverity;
  metadata?: any;
  serverTimestamp?: Date;
  createdAt: Date;
}

const IntegrityLogSchema: Schema = new Schema({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  round: { type: Number },
  day: { type: Number },
  severity: { 
    type: String, 
    enum: ['info', 'review_signal', 'high_priority'], 
    default: 'info' 
  },
  actionType: { 
    type: String, 
    enum: [
      'VISIBILITY_CHANGE', 
      'WINDOW_BLUR',
      'WINDOW_FOCUS',
      'RIGHT_CLICK_ATTEMPT', 
      'COPY_PASTE_ATTEMPT',
      'RECONNECT',
      'REPEATED_REQUEST',
      'DEADLINE_MANIPULATION_ATTEMPT',
      'UNUSUAL_SUBMISSION_PATTERN',
      'INVALID_SUBMISSION_ATTEMPT',
      'SUBMISSION', 
      'TIMEOUT_FALLBACK_SUBMISSION',
      'TIMEOUT_SUBMISSION',
      'OVERTIME_SUBMISSION',
      'FALLBACK_ACKNOWLEDGEMENT'
    ], 
    required: true 
  },
  metadata: { type: Schema.Types.Mixed },
  serverTimestamp: { type: Date, default: Date.now },
}, { timestamps: { createdAt: true, updatedAt: false } });

IntegrityLogSchema.index({ gameSessionId: 1, createdAt: -1 });
IntegrityLogSchema.index({ teamId: 1, round: 1 });

// Always refresh schema definition in dev environments if enum expanded
if (mongoose.models.IntegrityLog) {
  const modelEnumValues = (mongoose.models.IntegrityLog.schema?.path('actionType') as any)?.enumValues || [];
  if (!modelEnumValues.includes('DEADLINE_MANIPULATION_ATTEMPT')) {
    delete (mongoose.models as any).IntegrityLog;
  }
}

export default mongoose.models.IntegrityLog || mongoose.model<IIntegrityLog>('IntegrityLog', IntegrityLogSchema);

