import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  name: string;
  email: string;
  teamName?: string;
  userId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  rating: number; // 1 - 5
  gameGoods?: string;
  gameBads?: string;
  improvements?: string;
  additionalComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    teamName: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    gameGoods: { type: String, trim: true },
    gameBads: { type: String, trim: true },
    improvements: { type: String, trim: true },
    additionalComments: { type: String, trim: true },
  },
  { timestamps: true }
);

FeedbackSchema.index({ createdAt: -1 });

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
