import { unstable_rethrow } from 'next/navigation';
import { residences, avatars, defaultAvatar } from '@/lib/profile-options';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
export async function handle(work: () => Promise<Response>) {
  try { return await work(); }
  catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') return json({ error: 'Email or username already in use.' }, 409);
    console.error('Profile API failed:', error);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}
export async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) throw new ApiError(403, 'Invalid request origin.');
  try {
    const value = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new ApiError(400, 'Send a valid JSON object.'); }
}
export function text(value: unknown, name: string, max: number, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new ApiError(400, `${name} is required and must be at most ${max} characters.`);
  return value.trim();
}
export function password(value: unknown) {
  if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) throw new ApiError(400, 'Password must be at least 8 characters and at most 72 UTF-8 bytes.');
  return value;
}
export function account(input: Record<string, unknown>) {
  const email = text(input.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address.');
  const username = text(input.username, 'Username', 30);
  if (!/^[a-zA-Z0-9_]+$/.test(username)) throw new ApiError(400, 'Username may contain letters, numbers, and underscores.');
  const address = text(input.address, 'Residence', 80);
  if (!residences.includes(address)) throw new ApiError(400, 'Choose a residence from the list.');
  const avatar = input.avatar ?? defaultAvatar;
  if (typeof avatar !== 'string' || !avatars.some(option => option.id === avatar)) throw new ApiError(400, 'Choose a valid avatar.');
  return { email, username, full_name: text(input.full_name, 'Full name', 120), address, avatar };
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, 'Please log in to continue.');
  return user;
}
export function workouts(userId: number, saved = false) {
  const rows = db.prepare(`SELECT w.*, u.username AS owner_username FROM workouts w JOIN users u ON u.id = w.user_id
    ${saved ? 'JOIN saved_workouts s ON s.workout_id = w.id' : ''}
    WHERE ${saved ? 's.user_id = ? AND (w.user_id = s.user_id OR u.is_public = 1)' : 'w.user_id = ? AND w.is_template = 0'}
    ORDER BY w.date DESC, COALESCE(w.start_time, '') DESC, w.id DESC`).all(userId) as { id: number }[];
  const exercises = db.prepare(`SELECT we.id, e.name, eq.name AS equipment_name, we.sets, we.reps, we.weight,
    CASE WHEN LOWER(e.equipment_type) = 'cardio' AND we.weight IS NULL THEN 1 ELSE 0 END AS is_cardio
    FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id LEFT JOIN equipment eq ON eq.id = we.equipment_id WHERE we.workout_id = ? ORDER BY we.id`);
  return rows.map(w => ({ ...w, exercises: exercises.all(w.id) }));
}
