import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import Team from '@/models/Team';
import bcrypt from 'bcryptjs';
import { sendPlayerWelcomeEmail } from '@/lib/mail';

export async function GET() {
  await connectDB();
  try {
    const users = await User.find().select('-passwordHash').populate('teamId').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const { name, email, password, role, teamId } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password are required' }, { status: 400 });
    }

    const userRole = role === 'admin' ? 'admin' : 'player';

    // Requirement: Players MUST have a team. Admin account no need a team.
    let assignedTeamId = null;
    if (userRole === 'player') {
      if (!teamId || teamId.trim() === '') {
        return NextResponse.json({ success: false, error: 'Players must belong to a team. Please select or create a team first.' }, { status: 400 });
      }
      const existingTeam = await Team.findById(teamId);
      if (!existingTeam) {
        return NextResponse.json({ success: false, error: 'Assigned team not found' }, { status: 404 });
      }
      assignedTeamId = existingTeam._id;
    } else if (userRole === 'admin' && teamId && teamId.trim() !== '') {
      assignedTeamId = teamId;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'A user with this email already exists' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: userRole,
      teamId: assignedTeamId,
    });
    
    const populated = await User.findById(newUser._id).select('-passwordHash').populate('teamId');

    // Send attractive gaming-vibe welcome email to registered players
    let emailStatus = null;
    if (userRole === 'player') {
      const teamName = (populated?.teamId as any)?.name || 'Assigned Squad';
      try {
        emailStatus = await sendPlayerWelcomeEmail({
          toEmail: newUser.email,
          name: newUser.name,
          teamName,
        });
      } catch (mailErr) {
        console.error('[User Registration] Failed to send welcome email:', mailErr);
      }
    }

    return NextResponse.json({ success: true, user: populated, emailStatus });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await connectDB();
  try {
    const data = await request.json();
    const { _id, name, email, password, teamId, role } = data;
    
    if (!_id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(_id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const targetRole = role || user.role;
    let actualTeamId = user.teamId;

    if (targetRole === 'player') {
      const rawTeamId = teamId ? (typeof teamId === 'object' ? teamId._id : teamId) : null;
      if (!rawTeamId) {
        return NextResponse.json({ success: false, error: 'Players must belong to a team.' }, { status: 400 });
      }
      actualTeamId = rawTeamId;
    } else if (targetRole === 'admin') {
      actualTeamId = teamId ? (typeof teamId === 'object' ? teamId._id : teamId) : null;
    }

    const updateData: any = {
      role: targetRole,
      teamId: actualTeamId,
    };

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }
    
    const updatedUser = await User.findByIdAndUpdate(_id, updateData, { new: true })
      .select('-passwordHash')
      .populate('teamId');

    return NextResponse.json({ success: true, user: updatedUser });
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
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
