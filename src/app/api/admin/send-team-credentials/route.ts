import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import connectDB from '@/lib/mongoose';
import Team from '@/models/Team';
import User from '@/models/User';
import { sendPlayerCredentialsEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { teamId, password } = await request.json();

    if (!teamId || !password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Team ID and a valid team password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    const players = await User.find({ teamId: team._id, role: 'player' }).select('name email').lean();
    if (!players || players.length === 0) {
      return NextResponse.json(
        { success: false, error: `No registered players found in team "${team.name}". Add players before sending credentials.` },
        { status: 400 }
      );
    }

    const results = [];
    for (const player of players) {
      try {
        const res = await sendPlayerCredentialsEmail({
          toEmail: player.email,
          name: player.name,
          teamName: team.name,
          password: password.trim(),
        });
        results.push({ email: player.email, name: player.name, success: res.success, error: res.error });
      } catch (err: any) {
        results.push({ email: player.email, name: player.name, success: false, error: err.message });
      }
    }

    const sentCount = results.filter((r) => r.success).length;
    const failedCount = results.length - sentCount;

    return NextResponse.json({
      success: true,
      teamName: team.name,
      total: players.length,
      sentCount,
      failedCount,
      results,
    });
  } catch (error: any) {
    console.error('[API send-team-credentials] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch team credentials' },
      { status: 500 }
    );
  }
}
