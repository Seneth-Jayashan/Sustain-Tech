import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  teamId?: mongoose.Types.ObjectId;
  role: 'player' | 'admin';
  hasWatchedIntro?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  role: { type: String, enum: ['player', 'admin'], default: 'player' },
  hasWatchedIntro: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
