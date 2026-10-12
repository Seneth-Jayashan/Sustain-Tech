import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Scenario from '@/models/Scenario';
import Action from '@/models/Action';

export async function GET() {
  await connectDB();
  try {
    const scenarios = await Scenario.find().sort({ scenarioId: 1 }).lean();
    const allActions = await Action.find().lean();

    // Attach resolved action objects for each scenario in order
    const scenariosWithActions = scenarios.map((s: any) => ({
      ...s,
      actions: (s.availableActionIds || [])
        .map((id: string) => allActions.find((a: any) => a.actionId === id))
        .filter(Boolean)
    }));

    return NextResponse.json({ success: true, scenarios: scenariosWithActions, allActions });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch scenarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const { scenarioId, title, situation, priority, availableActionIds, day } = data;

    if (!scenarioId || !title || !situation) {
      return NextResponse.json({ success: false, error: 'Scenario ID, Title, and Situation briefing are required' }, { status: 400 });
    }

    const existing = await Scenario.findOne({ scenarioId: scenarioId.trim() });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A scenario with this ID already exists' }, { status: 400 });
    }

    const newScenario = await Scenario.create({
      scenarioId: scenarioId.trim(),
      title: title.trim(),
      situation: situation.trim(),
      priority: priority ?? (day ? 100 - day * 10 : 0),
      availableActionIds: availableActionIds || [],
      conditions: [{ field: 'day', operator: '===', value: day ?? 0 }]
    });

    return NextResponse.json({ success: true, scenario: { ...newScenario.toObject(), actions: [] } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const { _id, availableActionIds, ...rest } = data;

    if (!_id) {
      return NextResponse.json({ success: false, error: 'Scenario ID is required' }, { status: 400 });
    }

    const updateFields: any = { ...rest };
    if (Array.isArray(availableActionIds)) {
      updateFields.availableActionIds = availableActionIds;
    }

    const updated = await Scenario.findByIdAndUpdate(_id, updateFields, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Scenario not found' }, { status: 404 });
    }

    const allActions = await Action.find().lean();
    const scenarioWithActions = {
      ...updated,
      actions: (updated.availableActionIds || [])
        .map((id: string) => allActions.find((a: any) => a.actionId === id))
        .filter(Boolean)
    };

    return NextResponse.json({ success: true, scenario: scenarioWithActions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await connectDB();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const scenario = await Scenario.findById(id);
    if (scenario) {
      // Also delete or disassociate actions that belong to this scenario
      await Action.deleteMany({
        $or: [
          { scenarioId: scenario.scenarioId },
          { actionId: { $in: scenario.availableActionIds } }
        ]
      });
      await Scenario.findByIdAndDelete(id);
    }

    return NextResponse.json({ success: true, message: 'Scenario and attached actions removed' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete scenario' }, { status: 500 });
  }
}
