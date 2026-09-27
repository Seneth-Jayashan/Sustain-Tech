import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Action from '@/models/Action';

export async function GET() {
  await connectDB();
  try {
    const actions = await Action.find().sort({ actionId: 1 });
    return NextResponse.json({ success: true, actions });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch actions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const newAction = await Action.create(data);
    return NextResponse.json({ success: true, action: newAction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const updated = await Action.findByIdAndUpdate(data._id, data, { new: true });
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
    await Action.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete action' }, { status: 500 });
  }
}
