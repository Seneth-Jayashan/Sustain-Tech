import mongoose, { Schema, Document } from 'mongoose';

export type IntegrityActionType = 
  | 'VISIBILITY_CHANGE' 
  | 'RIGHT_CLICK_ATTEMPT' 
  | 'SUBMISSION' 
  | 'TIMEOUT_FALLBACK_SUBMISSION'
  | 'TIMEOUT_SUBMISSION'
  | 'OVERTIME_SUBMISSION'
  | 'FALLBACK_ACKNOWLEDGEMENT';

export interface IIntegrityLog extends Document {
  gameSessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  actionType: IntegrityActionType;
  metadata?: any;
  createdAt: Date;
}

const IntegrityLogSchema: Schema = new Schema({
  gameSessionId: { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { 
    type: String, 
    enum: [
      'VISIBILITY_CHANGE', 
      'RIGHT_CLICK_ATTEMPT', 
      'SUBMISSION', 
      'TIMEOUT_FALLBACK_SUBMISSION',
      'TIMEOUT_SUBMISSION',
      'OVERTIME_SUBMISSION',
      'FALLBACK_ACKNOWLEDGEMENT'
    ], 
    required: true 
  },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

if (mongoose.models.IntegrityLog) {
  const modelEnumValues = (mongoose.models.IntegrityLog.schema?.path('actionType') as any)?.enumValues || [];
  if (!modelEnumValues.includes('FALLBACK_ACKNOWLEDGEMENT')) {
    delete (mongoose.models as any).IntegrityLog;
  }
}

export default mongoose.models.IntegrityLog || mongoose.model<IIntegrityLog>('IntegrityLog', IntegrityLogSchema);

