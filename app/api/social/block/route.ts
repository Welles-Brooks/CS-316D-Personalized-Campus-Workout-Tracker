import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { blockUser, unblockUser, getBlockedUsers } from '@/lib/social-api';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocked = getBlockedUsers(user.id);
  return NextResponse.json({ blocked });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const targetId = Number(body.userId);
  if (!targetId || targetId === user.id) {
    return NextResponse.json({ error: 'Invalid user to block' }, { status: 400 });
  }

  blockUser(user.id, targetId);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const targetId = Number(body.userId);
  if (!targetId) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  unblockUser(user.id, targetId);
  return NextResponse.json({ success: true });
}