import mongoose, { Schema, Document } from 'mongoose';

export interface IScenario extends Document {
  scenarioId: string;
  title: string;
  situation: string;
  priority: number;
  conditions: Array<{
    field: string;
    operator: '>' | '<' | '===';
    value: number;
  }>;
  availableActionIds: string[]; // references actionId string
}

const ScenarioSchema: Schema = new Schema({
  scenarioId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  situation: { type: String, required: true },
  priority: { type: Number, default: 0 },
  conditions: [{
    field: String,
    operator: String,
    value: Number,
  }],
  availableActionIds: [{ type: String }],
});

export default mongoose.models.Scenario || mongoose.model<IScenario>('Scenario', ScenarioSchema);
