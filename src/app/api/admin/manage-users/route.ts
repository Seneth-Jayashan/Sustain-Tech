import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  await connectDB();
  try {
    const users = await User.find().select('-passwordHash').populate('teamId');
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const { name, email, password, role, teamId } = await request.json();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'player',
      teamId: teamId || null,
    });
    
    return NextResponse.json({ success: true, user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await connectDB();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const { _id, password, teamId, team, ...rest } = data;
    
    // Process teamId correctly if it's sent back as an object from populate
    const actualTeamId = teamId ? (typeof teamId === 'object' ? teamId._id : teamId) : null;
    
    const updateData: any = { ...rest, teamId: actualTeamId };
    
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }
    
    const updatedUser = await User.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
