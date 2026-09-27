import mongoose, { Schema, Document } from 'mongoose';

export interface IAction extends Document {
  actionId: string; // e.g. "C"
  title: string;
  description: string;
  baseImpacts: {
    floodPreparedness?: number;
    droughtPreparedness?: number;
    emergencyBudget?: number;
    drinkingWater?: number;
    waterSecurity?: number;
    healthRisk?: number;
    foodSecurity?: number;
    transportation?: number;
    communications?: number;
    communityTrust?: number;
    informationQuality?: number;
    decisionQuality?: number;
  };
  contextMultipliers: Array<{
    field: string;
    operator: '>' | '<' | '===';
    value: number;
    multiplier: number;
  }>;
}

const ActionSchema: Schema = new Schema({
  actionId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  baseImpacts: { type: Schema.Types.Mixed, default: {} },
  contextMultipliers: [{
    field: String,
    operator: String,
    value: Number,
    multiplier: Number
  }],
});

export default mongoose.models.Action || mongoose.model<IAction>('Action', ActionSchema);
