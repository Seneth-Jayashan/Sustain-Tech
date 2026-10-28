import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGameAccessStatus, updateGameAccessSettings } from '@/lib/gameAccess';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const status = await getGameAccessStatus();
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/game-access:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch access status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const { realGameUnlockTime, isAccessBlocked, message } = body;

    const updatedStatus = await updateGameAccessSettings({
      realGameUnlockTime,
      isAccessBlocked,
      message,
      updatedBy: session.userName || 'admin'
    });

    return NextResponse.json({
      success: true,
      notice: 'Game access settings updated successfully',
      ...updatedStatus
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/game-access:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update access settings' },
      { status: 500 }
    );
  }
}
