import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Scenario from '@/models/Scenario';

export async function GET() {
  await connectDB();
  try {
    const scenarios = await Scenario.find().sort({ scenarioId: 1 });
    return NextResponse.json({ success: true, scenarios });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch scenarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const newScenario = await Scenario.create(data);
    return NextResponse.json({ success: true, scenario: newScenario });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const updated = await Scenario.findByIdAndUpdate(data._id, data, { new: true });
    return NextResponse.json({ success: true, scenario: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await connectDB();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await Scenario.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete scenario' }, { status: 500 });
  }
}
