import db from '@/lib/db';
import { ApiError } from '@/lib/profile-api';

export const todayStr = () => new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD

export function num(v: unknown, label: string, min: number, max: number, int = false): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max || (int && !Number.isInteger(n)))
    throw new ApiError(400, `${label} must be ${int ? 'a whole number' : 'a number'} between ${min} and ${max}.`);
  return n;
}

export async function workoutId(params: Promise<{ id: string }>): Promise<number> {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) throw new ApiError(404, 'Workout not found.');
  return id;
}

type ParsedExercise = { exercise_id: number; equipment_id: number | null; sets: number | null; reps: number | null; weight: number | null };
type ParsedWorkout = {
  date: string; start_time: string | null; duration_minutes: number | null; location: string | null;
  feel: number | null; effort: number | null; notes: string | null; exercises: ParsedExercise[];
};

export function validateWorkout(input: any, isTemplate: boolean): ParsedWorkout {
  const date = isTemplate ? todayStr() : String(input.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'Date must be YYYY-MM-DD.');
  const start_time = input.start_time ? String(input.start_time) : null;
  if (start_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(start_time)) throw new ApiError(400, 'Start time must be HH:MM.');
  const duration_minutes = num(input.duration_minutes, 'Length', 1, 1440, true);
  const location = typeof input.location === 'string' ? input.location.trim().slice(0, 100) || null : null;
  const feel = isTemplate ? null : num(input.feel, 'Felt', 1, 10, true);
  const effort = isTemplate ? null : num(input.effort, 'Effort', 1, 10, true);
  const notes = typeof input.notes === 'string' ? input.notes.trim().slice(0, 2000) || null : null;

  if (!Array.isArray(input.exercises) || input.exercises.length < 1 || input.exercises.length > 50)
    throw new ApiError(400, 'Add between 1 and 50 exercises.');

  const exercises = input.exercises.map((e: any): ParsedExercise => {
    const exercise_id = Number(e?.exercise_id);
    const ex = db.prepare('SELECT equipment_id FROM exercises WHERE id = ?').get(exercise_id) as { equipment_id: number | null } | undefined;
    if (!Number.isInteger(exercise_id) || !ex) throw new ApiError(400, 'Choose a valid exercise for every row.');
    const equipment_id = e.equipment_id ? Number(e.equipment_id) : ex.equipment_id;
    if (equipment_id !== null && !db.prepare('SELECT 1 FROM equipment WHERE id = ?').get(equipment_id))
      throw new ApiError(400, 'Unknown equipment.');
    return {
      exercise_id, equipment_id,
      sets: num(e.sets, 'Sets', 1, 100, true),
      reps: num(e.reps, 'Reps', 0, 10000, true),
      weight: num(e.weight, 'Weight', 0, 2000),
    };
  });
  return { date, start_time, duration_minutes, location, feel, effort, notes, exercises };
}

const saveRow = () => db.prepare('INSERT OR IGNORE INTO saved_workouts (user_id, workout_id) VALUES (?, ?)');

export const insertWorkout = db.transaction((userId: number, v: ParsedWorkout, isTemplate: boolean): number => {
  const res = db.prepare(
    `INSERT INTO workouts (user_id, date, start_time, duration_minutes, location, feel, effort, notes, is_template)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(userId, v.date, v.start_time, v.duration_minutes, v.location, v.feel, v.effort, v.notes, isTemplate ? 1 : 0);
  const wid = Number(res.lastInsertRowid);
  const ins = db.prepare('INSERT INTO workout_exercises (workout_id, exercise_id, equipment_id, sets, reps, weight) VALUES (?,?,?,?,?,?)');
  for (const e of v.exercises) ins.run(wid, e.exercise_id, e.equipment_id, e.sets, e.reps, e.weight);
  if (isTemplate) saveRow().run(userId, wid); // owner's templates appear in their saved list
  return wid;
});

const signature = (wid: number) =>
  (db.prepare('SELECT exercise_id FROM workout_exercises WHERE workout_id = ? ORDER BY id').all(wid) as { exercise_id: number }[])
    .map(r => r.exercise_id).join(',');

// Copy a workout's exercises into a new template for userId (skips if an identical template exists).
export const saveAsTemplate = db.transaction((srcId: number, userId: number): { id: number; existed: boolean } => {
  const sig = signature(srcId);
  const mine = db.prepare('SELECT id FROM workouts WHERE user_id = ? AND is_template = 1').all(userId) as { id: number }[];
  const dup = mine.find(t => signature(t.id) === sig);
  if (dup) { saveRow().run(userId, dup.id); return { id: dup.id, existed: true }; }

  const src = db.prepare('SELECT location, duration_minutes, notes FROM workouts WHERE id = ?').get(srcId) as any;
  const wid = Number(db.prepare(
    `INSERT INTO workouts (user_id, date, duration_minutes, location, notes, is_template) VALUES (?,?,?,?,?,1)`
  ).run(userId, todayStr(), src.duration_minutes, src.location, src.notes).lastInsertRowid);
  db.prepare(
    `INSERT INTO workout_exercises (workout_id, exercise_id, equipment_id, sets, reps, weight)
     SELECT ?, exercise_id, equipment_id, sets, reps, weight FROM workout_exercises WHERE workout_id = ? ORDER BY id`
  ).run(wid, srcId);
  saveRow().run(userId, wid);
  return { id: wid, existed: false };
});

// Returns null if missing or not visible to the viewer (own workout, or owner's account is public).
export function getWorkout(id: number, viewerId: number) {
  const w = db.prepare(
    'SELECT w.*, u.username, u.is_public FROM workouts w JOIN users u ON u.id = w.user_id WHERE w.id = ?'
  ).get(id) as any;
  if (!w || (w.user_id !== viewerId && !w.is_public)) return null;
  const exercises = db.prepare(
    `SELECT we.id, we.exercise_id, e.name, we.equipment_id, q.name AS equipment_name,
            (e.equipment_type LIKE '%cardio%') AS is_cardio, we.sets, we.reps, we.weight
     FROM workout_exercises we
     JOIN exercises e ON e.id = we.exercise_id
     LEFT JOIN equipment q ON q.id = we.equipment_id
     WHERE we.workout_id = ? ORDER BY we.id`
  ).all(id);
  const saved = !!db.prepare('SELECT 1 FROM saved_workouts WHERE user_id = ? AND workout_id = ?').get(viewerId, id);
  return {
    id: w.id, owner_username: w.username, date: w.date, start_time: w.start_time,
    duration_minutes: w.duration_minutes, location: w.location, feel: w.feel, effort: w.effort,
    notes: w.notes, is_template: !!w.is_template, is_owner: w.user_id === viewerId, is_saved: saved, exercises,
  };
}