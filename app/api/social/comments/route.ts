import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getCommentsForWorkout, addComment, getRecentCommentsByUser } from '@/lib/social-api';

// GET /api/social/comments
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workoutIdParam = req.nextUrl.searchParams.get('workoutId');
  const userIdParam = req.nextUrl.searchParams.get('userId');

  if (workoutIdParam) {
    const comments = getCommentsForWorkout(Number(workoutIdParam));
    return NextResponse.json({ comments });
  }

  if (userIdParam) {
    const comments = getRecentCommentsByUser(Number(userIdParam), 5);
    return NextResponse.json({ comments });
  }

  return NextResponse.json({ error: 'workoutId or userId required' }, { status: 400 });
}

// POST /api/social/comments
// Adds a new comment to a workout
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const workoutId = Number(body.workoutId);
    const text = body.body;
    const parentId = body.parentCommentId ? Number(body.parentCommentId) : null;

    if (!workoutId || !text?.trim()) {
      return NextResponse.json({ error: 'Workout ID and comment text are required' }, { status: 400 });
    }

    addComment(workoutId, user.id, text, parentId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 });
  }
}