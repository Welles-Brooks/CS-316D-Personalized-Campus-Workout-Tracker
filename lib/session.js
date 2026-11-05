import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import db from './db';

const options = {
  password: process.env.SESSION_SECRET,
  cookieName: 'fitapp_session',
};

export async function getSession() {
  return getIronSession(await cookies(), options);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;
  return db.prepare(
    `SELECT id, email, username, full_name, address, fitness_goals,
            experience_level, preferred_workout_minutes, workouts_per_week, is_public
     FROM users WHERE id = ?`
  ).get(session.userId) ?? null;
}