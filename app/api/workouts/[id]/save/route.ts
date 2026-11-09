import db from '@/lib/db';
import { ApiError, handle, json, requireUser } from '@/lib/profile-api';
import { getWorkout, workoutId } from '@/lib/workouts-api';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const id = await workoutId(params);
    if (!getWorkout(id, user.id)) throw new ApiError(404, 'Workout not found.'); // enforces public/private
    db.prepare('INSERT OR IGNORE INTO saved_workouts (user_id, workout_id) VALUES (?, ?)').run(user.id, id);
    return json({ success: true });
  });
}

export async function DELETE(_: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    db.prepare('DELETE FROM saved_workouts WHERE user_id = ? AND workout_id = ?').run(user.id, await workoutId(params));
    return json({ success: true });
  });
}