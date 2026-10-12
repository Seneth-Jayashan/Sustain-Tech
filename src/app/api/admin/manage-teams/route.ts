import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Team from '@/models/Team';
import User from '@/models/User';
import GameSession from '@/models/GameSession';

export async function GET() {
  await connectDB();
  try {
    const teams = await Team.find().sort({ createdAt: 1 }).lean();
    const users = await User.find({ role: 'player' }).select('-passwordHash').lean();
    
    const teamsWithPlayers = teams.map((t: any) => ({
      ...t,
      players: users.filter((u: any) => u.teamId && u.teamId.toString() === t._id.toString())
    }));

    return NextResponse.json({ success: true, teams: teamsWithPlayers });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Team name is required' }, { status: 400 });
    }
    await Team.collection.dropIndex('email_1').catch(() => {});
    const newTeam = await Team.create({ name: name.trim() });
    return NextResponse.json({ success: true, team: { ...newTeam.toObject(), players: [] } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create team' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const { _id, name } = data;
    if (!_id || !name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Team ID and valid name are required' }, { status: 400 });
    }
    const updatedTeam = await Team.findByIdAndUpdate(_id, { name: name.trim() }, { new: true });
    return NextResponse.json({ success: true, team: updatedTeam });
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
      return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 });
    }
    // Delete team
    await Team.findByIdAndDelete(id);
    // Cascade delete players attached to this team (players cannot exist without a team)
    await User.deleteMany({ teamId: id, role: 'player' });
    // Also cleanup active or past game sessions for this team
    await GameSession.deleteMany({ teamId: id });

    return NextResponse.json({ success: true, message: 'Team and member accounts deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete team' }, { status: 500 });
  }
}
