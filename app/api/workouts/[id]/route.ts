import db from '@/lib/db';
import { ApiError, body, handle, json, requireUser } from '@/lib/profile-api';
import { getWorkout, num, workoutId } from '@/lib/workouts-api';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const w = getWorkout(await workoutId(params), user.id);
    if (!w) throw new ApiError(404, 'Workout not found.');
    return json({ workout: w });
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const id = await workoutId(params);
    const row = db.prepare('SELECT user_id, is_template FROM workouts WHERE id = ?').get(id) as any;
    if (!row) throw new ApiError(404, 'Workout not found.');
    if (row.user_id !== user.id) throw new ApiError(403, 'You can only log your own workouts.');
    if (row.is_template) throw new ApiError(400, 'Saved workouts cannot be logged. Use it to start a workout first.');
    const input: any = await body(request);
    const feel = num(input.feel, 'Felt', 1, 10, true);
    const effort = num(input.effort, 'Effort', 1, 10, true);
    const notes = typeof input.notes === 'string' ? input.notes.trim().slice(0, 2000) || null : null;
    db.prepare('UPDATE workouts SET feel = ?, effort = ?, notes = ? WHERE id = ?').run(feel, effort, notes, id);
    return json({ workout: getWorkout(id, user.id) });
  });
}