import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getUserPrivacy, updatePrivacy } from '@/lib/social-api';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isPublic = getUserPrivacy(user.id);
  return NextResponse.json({ is_public: isPublic });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const isPublic = Boolean(body.is_public);
  updatePrivacy(user.id, isPublic);

  return NextResponse.json({ success: true, is_public: isPublic });
}