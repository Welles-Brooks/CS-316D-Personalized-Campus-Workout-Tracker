import db from '@/lib/db';
import { account, ApiError, body, handle, json, requireUser, text } from '@/lib/profile-api';

export async function GET() { return handle(async () => json({ user: await requireUser() })); }
export async function PATCH(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input = await body(request);
    const fields = account(input);
    const goals = text(input.fitness_goals ?? '', 'Fitness goals', 2000, false);
    const level = text(input.experience_level ?? '', 'Experience level', 30, false);
    if (!['', 'Beginner', 'Intermediate', 'Advanced'].includes(level)) throw new ApiError(400, 'Choose a valid experience level.');
    const integer = (value: unknown, name: string, max: number) => {
      if (value === '' || value === null || value === undefined) return null;
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > max) throw new ApiError(400, `${name} must be between 1 and ${max}.`);
      return value;
    };
    const minutes = integer(input.preferred_workout_minutes, 'Workout length', 1440);
    const frequency = integer(input.workouts_per_week, 'Workouts per week', 21);
    const taken = db.prepare('SELECT id FROM users WHERE id != ? AND (email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE)').get(user.id, fields.email, fields.username);
    if (taken) throw new ApiError(409, 'Email or username already in use.');
    db.prepare(`UPDATE users SET email = @email, username = @username, full_name = @full_name, address = @address, avatar = @avatar,
      fitness_goals = @goals, experience_level = @level, preferred_workout_minutes = @minutes, workouts_per_week = @frequency WHERE id = @id`).run({ ...fields, goals, level, minutes, frequency, id: user.id });
    return json({ user: await requireUser() });
  });
}
