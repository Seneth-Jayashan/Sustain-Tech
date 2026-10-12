import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Action from '@/models/Action';
import Scenario from '@/models/Scenario';

export async function GET(request: Request) {
  await connectDB();
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get('scenarioId');
    
    const query: any = {};
    if (scenarioId) {
      query.scenarioId = scenarioId;
    }

    const actions = await Action.find(query).sort({ actionId: 1 });
    return NextResponse.json({ success: true, actions });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch actions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const { actionId, title, description, baseImpacts, scenarioId, contextMultipliers } = data;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Action title is required' }, { status: 400 });
    }

    // User requirement: Actions must have a scenario
    if (!scenarioId || !scenarioId.trim()) {
      return NextResponse.json({ success: false, error: 'Actions must be assigned to a scenario. Please select or create a scenario first.' }, { status: 400 });
    }

    const scenario = await Scenario.findOne({ scenarioId: scenarioId.trim() });
    if (!scenario) {
      return NextResponse.json({ success: false, error: 'Selected scenario was not found' }, { status: 404 });
    }

    // Auto-generate unique actionId if not supplied
    const finalActionId = (actionId && actionId.trim()) 
      ? actionId.trim() 
      : `${scenarioId}_ACT_${Date.now().toString().slice(-4)}`;

    const existing = await Action.findOne({ actionId: finalActionId });
    if (existing) {
      return NextResponse.json({ success: false, error: 'An action with this ID already exists' }, { status: 400 });
    }

    const newAction = await Action.create({
      actionId: finalActionId,
      scenarioId: scenario.scenarioId,
      title: title.trim(),
      description: description ? description.trim() : '',
      baseImpacts: baseImpacts || {},
      contextMultipliers: contextMultipliers || []
    });

    // Add to scenario's availableActionIds array
    await Scenario.findOneAndUpdate(
      { scenarioId: scenario.scenarioId },
      { $addToSet: { availableActionIds: newAction.actionId } }
    );

    return NextResponse.json({ success: true, action: newAction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const { _id, scenarioId, ...rest } = data;

    if (!_id) {
      return NextResponse.json({ success: false, error: 'Action ID is required' }, { status: 400 });
    }

    const existingAction = await Action.findById(_id);
    if (!existingAction) {
      return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
    }

    // If scenarioId is changing, update availableActionIds in both scenarios
    if (scenarioId && scenarioId !== existingAction.scenarioId) {
      // Remove from old scenario
      if (existingAction.scenarioId) {
        await Scenario.findOneAndUpdate(
          { scenarioId: existingAction.scenarioId },
          { $pull: { availableActionIds: existingAction.actionId } }
        );
      }
      // Add to new scenario
      await Scenario.findOneAndUpdate(
        { scenarioId },
        { $addToSet: { availableActionIds: existingAction.actionId } }
      );
      rest.scenarioId = scenarioId;
    }

    const updated = await Action.findByIdAndUpdate(_id, rest, { new: true });
    return NextResponse.json({ success: true, action: updated });
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
      return NextResponse.json({ success: false, error: 'Action ID is required' }, { status: 400 });
    }

    const action = await Action.findById(id);
    if (action) {
      // Remove from any scenarios referencing it
      await Scenario.updateMany(
        {},
        { $pull: { availableActionIds: action.actionId } }
      );
      await Action.findByIdAndDelete(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete action' }, { status: 500 });
  }
}
