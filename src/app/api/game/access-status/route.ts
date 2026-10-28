import { NextResponse } from 'next/server';
import { getGameAccessStatus } from '@/lib/gameAccess';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getGameAccessStatus();
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error: any) {
    console.error('Error fetching game access status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game access status' },
      { status: 500 }
    );
  }
}
