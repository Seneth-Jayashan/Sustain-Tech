import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Team from '@/models/Team';

export async function GET() {
  await connectDB();
  try {
    const teams = await Team.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, teams });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const { name } = await request.json();
    const newTeam = await Team.create({ name });
    return NextResponse.json({ success: true, team: newTeam });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create team' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await connectDB();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await Team.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete team' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const { _id, ...rest } = data;
    const updatedTeam = await Team.findByIdAndUpdate(_id, rest, { new: true });
    return NextResponse.json({ success: true, team: updatedTeam });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
