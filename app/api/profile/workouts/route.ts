import { handle, json, requireUser, workouts } from '@/lib/profile-api';
export async function GET() { return handle(async () => json({ workouts: workouts((await requireUser()).id) })); }
