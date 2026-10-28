import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Feedback from '@/models/Feedback';
import { getSession } from '@/lib/session';
import { sendFeedbackToAdminEmail, sendFeedbackReplyToPlayerEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await connectDB();
    const session = await getSession();

    const body = await request.json();
    const {
      name,
      email,
      teamName,
      rating,
      gameGoods,
      gameBads,
      improvements,
      additionalComments,
    } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid email address is required' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanTeam = (teamName || session?.teamName || '').trim();

    // 1. Store in MongoDB
    const feedbackDoc = await Feedback.create({
      name: cleanName,
      email: cleanEmail,
      teamName: cleanTeam || undefined,
      userId: session?.userId || undefined,
      teamId: session?.teamId || undefined,
      rating: numericRating,
      gameGoods: gameGoods?.trim() || undefined,
      gameBads: gameBads?.trim() || undefined,
      improvements: improvements?.trim() || undefined,
      additionalComments: additionalComments?.trim() || undefined,
    });

    // 2. Dispatch email to feedback@sustaintech.online
    sendFeedbackToAdminEmail({
      name: cleanName,
      email: cleanEmail,
      teamName: cleanTeam,
      rating: numericRating,
      gameGoods,
      gameBads,
      improvements,
      additionalComments,
    }).catch((err) => {
      console.error('[Feedback] Error sending email to feedback@sustaintech.online:', err);
    });

    // 3. Dispatch confirmation reply email to player
    sendFeedbackReplyToPlayerEmail({
      toEmail: cleanEmail,
      name: cleanName,
    }).catch((err) => {
      console.error('[Feedback] Error sending reply to player:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedbackDoc._id,
    });
  } catch (error: any) {
    console.error('[Feedback API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, feedbacks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch feedback' }, { status: 500 });
  }
}
