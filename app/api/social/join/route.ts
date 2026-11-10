import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { toggleJoinWorkout } from '@/lib/social-api';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const workoutId = Number(body.workoutId);
  if (!workoutId) return NextResponse.json({ error: 'Invalid workout ID' }, { status: 400 });

  const result = toggleJoinWorkout(workoutId, user.id);
  return NextResponse.json(result);
}