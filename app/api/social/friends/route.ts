import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getFriends, searchUsers, addFriend, removeFriend } from '@/lib/social-api';

// GET /api/social/friends
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get('q');
  if (query) {
    const results = searchUsers(user.id, query);
    return NextResponse.json({ results });
  }

  const friends = getFriends(user.id);
  return NextResponse.json({ friends });
}

// POST /api/social/friends
// Adds a friend by friendId
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const friendId = Number(body.friendId);

    if (!friendId || friendId === user.id) {
      return NextResponse.json({ error: 'Invalid friend ID' }, { status: 400 });
    }

    addFriend(user.id, friendId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add friend' }, { status: 500 });
  }
}

// DELETE /api/social/friends
// Removes a friend by friendId
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const friendId = Number(body.friendId);

    if (!friendId) {
      return NextResponse.json({ error: 'Invalid friend ID' }, { status: 400 });
    }

    removeFriend(user.id, friendId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 });
  }
}