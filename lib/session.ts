import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import db from './db';

export type User = {
  id: number; email: string; username: string; full_name: string; address: string; avatar: string;
  fitness_goals: string | null; experience_level: string | null;
  preferred_workout_minutes: number | null; workouts_per_week: number | null; is_public: number;
};
export async function getSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.');
  return getIronSession<{ userId?: number }>(await cookies(), {
    password: secret, cookieName: 'fitapp_session',
    cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax', path: '/' },
  });
}
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return db.prepare(`SELECT id, email, username, full_name, address, avatar, fitness_goals,
    experience_level, preferred_workout_minutes, workouts_per_week, is_public FROM users WHERE id = ?`).get(session.userId) as User | undefined ?? null;
}
