import { ApiError, handle, json, requireUser } from '@/lib/profile-api';
import { getWorkout, saveAsTemplate, workoutId } from '@/lib/workouts-api';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const id = await workoutId(params);
    const w = getWorkout(id, user.id);
    if (!w) throw new ApiError(404, 'Workout not found.');
    if (!w.is_owner) throw new ApiError(403, 'You can only do this with your own workouts.');
    return json(saveAsTemplate(id, user.id), 201);
  });
}