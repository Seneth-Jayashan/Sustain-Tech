import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  key: string;
  realGameUnlockTime: Date | null;
  isAccessBlocked: boolean;
  message?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true, default: 'game_access' },
  realGameUnlockTime: { type: Date, default: null },
  isAccessBlocked: { type: Boolean, default: false },
  message: { type: String, default: '' },
  updatedBy: { type: String, default: 'admin' },
}, { timestamps: true });

export default mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
