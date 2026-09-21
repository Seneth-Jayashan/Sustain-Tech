import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import Team from '@/models/Team';
import User from '@/models/User';
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Explicitly reference Team to ensure the model is registered before population
    if (!Team) throw new Error("Team model failed to load");

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const user = await User.findOne({ email }).populate('teamId');
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // For admins, teamId might be null. Safely extract team info.
    const teamIdStr = user.teamId ? (user.teamId as any)._id.toString() : '';
    const teamNameStr = user.teamId ? (user.teamId as any).name : 'Admin Team';

    await createSession(user._id.toString(), user.name, teamIdStr, teamNameStr, user.role);

    return NextResponse.json({ success: true, teamId: teamIdStr, role: user.role });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
