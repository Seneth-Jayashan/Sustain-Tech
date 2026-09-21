import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  eventId: string;
  type: string; // e.g. RAIN_DETECTED, RIVER_RISING
  description: string;
  probability: number; // 0 to 1
  conditions: Array<{
    field: string;
    operator: '>' | '<' | '===';
    value: number;
  }>;
  effects: Array<{
    field: string;
    delta: number;
  }>;
  followUpEvents?: string[]; // eventIds
}

const EventSchema: Schema = new Schema({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  probability: { type: Number, required: true },
  conditions: [{
    field: String,
    operator: String,
    value: Number,
  }],
  effects: [{
    field: String,
    delta: Number,
  }],
  followUpEvents: [{ type: String }],
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
