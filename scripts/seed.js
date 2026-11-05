// scripts/seed.js
// Run with: npm run db:seed   (run npm run db:init first)
// Safe to re-run: it wipes all tables and re-inserts the fake data.

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join('data', 'app.db'));
db.pragma('foreign_keys = ON');

const PASSWORD = 'password123'; // every fake user logs in with this

// ---------------------------------------------------------------
// 1. Wipe existing data (children first because of foreign keys)
// ---------------------------------------------------------------
const tables = [
  'blocks', 'saved_workouts', 'comments', 'friendships',
  'workout_exercises', 'workouts', 'exercises', 'equipment', 'users',
];

// ---------------------------------------------------------------
// 2. Data
// ---------------------------------------------------------------

// ----- USERS (owner: auth/profile) -----
const users = [
  {
    email: 'carlie@gmail.com', username: 'carlielifts', full_name: 'Carlie Scheer',
    address: '123 Main St, Durham, NC', fitness_goals: 'Build muscle and strength',
    experience_level: 'Intermediate', preferred_workout_minutes: 60, workouts_per_week: 4, is_public: 1,
  },
  {
    email: 'pk@gmail.com', username: 'pkruns', full_name: 'Priscilla Kang',
    address: '124 Main St, Durham, NC', fitness_goals: 'Improve cardio',
    experience_level: 'Beginner', preferred_workout_minutes: 45, workouts_per_week: 3, is_public: 1,
  },
  {
    email: 'sola@gmail.com', username: 'solafit', full_name: 'Sola Corrado',
    address: '125 Main St, Durham, NC', fitness_goals: 'General fitness',
    experience_level: 'Advanced', preferred_workout_minutes: 75, workouts_per_week: 5, is_public: 0,
  },
];

// ----- EQUIPMENT (owner: equipment/exercises teammate) -----
const equipment = [
  { name: 'Treadmill', type: 'Cardio', description: 'Motorized belt for walking, jogging, or running with adjustable speed and incline.' },
  { name: 'Stationary Bike', type: 'Cardio', description: 'Low-impact upright bike with adjustable resistance.' },
  { name: 'Elliptical', type: 'Cardio', description: 'Low-impact full-body cardio machine with moving handles.' },
  { name: 'Rowing Machine', type: 'Cardio', description: 'Air-resistance rower that works legs, back, and arms.' },
  { name: 'Leg Press Machine', type: 'Strength Machine', description: 'Seated machine for pressing a weighted platform with the legs.' },
  { name: 'Chest Press Machine', type: 'Strength Machine', description: 'Seated machine that targets the chest, shoulders, and triceps.' },
  { name: 'Lat Pulldown Machine', type: 'Strength Machine', description: 'Cable machine for pulling a bar down toward the chest to work the back.' },
  { name: 'Cable Machine', type: 'Strength Machine', description: 'Adjustable pulley stack for a wide range of exercises.' },
  { name: 'Dumbbells', type: 'Free Weights', description: 'Fixed-weight dumbbells from 5 to 100 lbs.' },
  { name: 'Barbell and Squat Rack', type: 'Free Weights', description: 'Olympic barbell with plates and an adjustable squat rack.' },
  { name: 'Flat Bench', type: 'Free Weights', description: 'Flat bench used for pressing and supported dumbbell work.' },
];

// ----- EXERCISES (owner: equipment/exercises teammate) -----
// "equipment" is the equipment NAME above; it gets turned into equipment_id below.
const exercises = [
  { name: 'Treadmill Run', description: 'Steady-state or interval running on the treadmill.', muscle_group: 'Cardio', equipment: 'Treadmill' },
  { name: 'Stationary Bike Ride', description: 'Seated cycling at a chosen resistance level.', muscle_group: 'Legs', equipment: 'Stationary Bike' },
  { name: 'Elliptical Session', description: 'Smooth, low-impact cardio session.', muscle_group: 'Cardio', equipment: 'Elliptical' },
  { name: 'Rowing', description: 'Full-body rowing intervals or steady rowing.', muscle_group: 'Back', equipment: 'Rowing Machine' },
  { name: 'Leg Press', description: 'Press the platform away using your legs.', muscle_group: 'Legs', equipment: 'Leg Press Machine' },
  { name: 'Machine Chest Press', description: 'Press the handles forward from chest level.', muscle_group: 'Chest', equipment: 'Chest Press Machine' },
  { name: 'Lat Pulldown', description: 'Pull the bar down to your upper chest.', muscle_group: 'Back', equipment: 'Lat Pulldown Machine' },
  { name: 'Cable Row', description: 'Seated row using the cable machine.', muscle_group: 'Back', equipment: 'Cable Machine' },
  { name: 'Triceps Pushdown', description: 'Push the cable attachment down, keeping elbows pinned.', muscle_group: 'Arms', equipment: 'Cable Machine' },
  { name: 'Dumbbell Curl', description: 'Curl dumbbells up while keeping elbows still.', muscle_group: 'Arms', equipment: 'Dumbbells' },
  { name: 'Dumbbell Shoulder Press', description: 'Press dumbbells overhead from shoulder height.', muscle_group: 'Shoulders', equipment: 'Dumbbells' },
  { name: 'Dumbbell Bench Press', description: 'Press dumbbells up from a flat bench.', muscle_group: 'Chest', equipment: 'Flat Bench' },
  { name: 'Barbell Squat', description: 'Squat with a barbell on your upper back.', muscle_group: 'Legs', equipment: 'Barbell and Squat Rack' },
  { name: 'Barbell Deadlift', description: 'Lift the barbell from the floor to hip height.', muscle_group: 'Back', equipment: 'Barbell and Squat Rack' },
  { name: 'Barbell Bench Press', description: 'Press the barbell from your chest on a flat bench.', muscle_group: 'Chest', equipment: 'Flat Bench' },
];

// ----- WORKOUTS (owner: workouts teammate) -----
// Each exercise: [exercise name, sets, reps, weight (lbs, null for cardio)]
// Cardio exercises store minutes in "reps" for simplicity; change if your team prefers.
const workouts = [
  {
    user: 'carlielifts', date: '2026-10-20', start_time: '17:30', duration_minutes: 65, location: 'Wilson Rec Center',
    feel: 8, effort: 8, notes: 'Great push day. Bench felt strong.', is_template: 0,
    exercises: [
      ['Barbell Bench Press', 4, 8, 155],
      ['Dumbbell Shoulder Press', 3, 10, 40],
      ['Triceps Pushdown', 3, 12, 50],
    ],
  },
  {
    user: 'carlielifts', date: '2026-10-23', start_time: '17:00', duration_minutes: 70, location: 'Wilson Rec Center',
    feel: 7, effort: 9, notes: 'Leg day. Squats were tough.', is_template: 0,
    exercises: [
      ['Barbell Squat', 4, 6, 205],
      ['Leg Press', 3, 12, 270],
      ['Stationary Bike Ride', 1, 10, null],
    ],
  },
  {
    user: 'carlielifts', date: '2026-10-28', start_time: '18:00', duration_minutes: 60, location: 'Wilson Rec Center',
    feel: 9, effort: 7, notes: 'Pull day, felt good.', is_template: 0,
    exercises: [
      ['Lat Pulldown', 4, 10, 120],
      ['Cable Row', 3, 12, 100],
      ['Dumbbell Curl', 3, 10, 30],
    ],
  },
  {
    user: 'pkruns', date: '2026-10-22', start_time: '07:15', duration_minutes: 40, location: 'Wilson Rec Center',
    feel: 6, effort: 6, notes: 'First time on the treadmill intervals.', is_template: 0,
    exercises: [
      ['Treadmill Run', 1, 25, null],
      ['Elliptical Session', 1, 15, null],
    ],
  },
  {
    user: 'pkruns', date: '2026-10-29', start_time: '07:00', duration_minutes: 45, location: 'Wilson Rec Center',
    feel: 8, effort: 7, notes: 'Added some light strength work.', is_template: 0,
    exercises: [
      ['Treadmill Run', 1, 30, null],
      ['Machine Chest Press', 3, 12, 60],
      ['Leg Press', 3, 12, 120],
    ],
  },
  {
    user: 'solafit', date: '2026-10-25', start_time: '16:00', duration_minutes: 80, location: 'Wilson Rec Center',
    feel: 9, effort: 9, notes: 'Heavy deadlift day.', is_template: 0,
    exercises: [
      ['Barbell Deadlift', 5, 5, 315],
      ['Rowing', 1, 15, null],
    ],
  },
  // A reusable template workout (planned, not completed) that others can save/join
  {
    user: 'carlielifts', date: '2026-11-07', start_time: '17:30', duration_minutes: 60, location: 'Wilson Rec Center',
    feel: null, effort: null, notes: 'Planned upper body day. Come join!', is_template: 1,
    exercises: [
      ['Barbell Bench Press', 4, 8, 160],
      ['Lat Pulldown', 4, 10, 125],
      ['Dumbbell Shoulder Press', 3, 10, 40],
    ],
  },
];

// ---------------------------------------------------------------
// 3. Insert everything inside one transaction
// ---------------------------------------------------------------
const seed = db.transaction(() => {
  // wipe + reset auto-increment counters
  for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();
  db.prepare(`DELETE FROM sqlite_sequence`).run();

  // users
  const passwordHash = bcrypt.hashSync(PASSWORD, 10);
  const insertUser = db.prepare(`
    INSERT INTO users (email, username, full_name, address, password_hash, fitness_goals,
                       experience_level, preferred_workout_minutes, workouts_per_week, is_public)
    VALUES (@email, @username, @full_name, @address, @password_hash, @fitness_goals,
            @experience_level, @preferred_workout_minutes, @workouts_per_week, @is_public)
  `);
  const userIds = {}; // username -> id
  for (const u of users) {
    userIds[u.username] = insertUser.run({ ...u, password_hash: passwordHash }).lastInsertRowid;
  }

  // equipment
  const insertEquipment = db.prepare(
    'INSERT INTO equipment (name, type, description) VALUES (@name, @type, @description)'
  );
  const equipmentIds = {}; // name -> id
  const equipmentTypes = {}; // name -> type
  for (const e of equipment) {
    equipmentIds[e.name] = insertEquipment.run(e).lastInsertRowid;
    equipmentTypes[e.name] = e.type;
  }

  // exercises
  const insertExercise = db.prepare(`
    INSERT INTO exercises (name, description, muscle_group, equipment_type, equipment_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const exerciseIds = {}; // name -> id
  const exerciseEquipment = {}; // name -> equipment id
  for (const ex of exercises) {
    const eqId = equipmentIds[ex.equipment];
    exerciseIds[ex.name] = insertExercise.run(
      ex.name, ex.description, ex.muscle_group, equipmentTypes[ex.equipment], eqId
    ).lastInsertRowid;
    exerciseEquipment[ex.name] = eqId;
  }

  // workouts + workout_exercises
  const insertWorkout = db.prepare(`
    INSERT INTO workouts (user_id, date, start_time, duration_minutes, location, feel, effort, notes, is_template)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertWE = db.prepare(`
    INSERT INTO workout_exercises (workout_id, exercise_id, equipment_id, sets, reps, weight)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const workoutIds = [];
  for (const w of workouts) {
    const wid = insertWorkout.run(
      userIds[w.user], w.date, w.start_time, w.duration_minutes, w.location,
      w.feel, w.effort, w.notes, w.is_template
    ).lastInsertRowid;
    workoutIds.push(wid);
    for (const [name, sets, reps, weight] of w.exercises) {
      insertWE.run(wid, exerciseIds[name], exerciseEquipment[name], sets, reps, weight);
    }
  }

  // friendships (stored both directions so "my friends" is a simple query)
  const insertFriend = db.prepare('INSERT INTO friendships (user_id, friend_id) VALUES (?, ?)');
  const befriend = (a, b) => {
    insertFriend.run(userIds[a], userIds[b]);
    insertFriend.run(userIds[b], userIds[a]);
  };
  befriend('carlielifts', 'pkruns');
  befriend('carlielifts', 'solafit');

  // comments (one top-level comment and one reply)
  const insertComment = db.prepare(
    'INSERT INTO comments (workout_id, user_id, parent_comment_id, body) VALUES (?, ?, ?, ?)'
  );
  const c1 = insertComment.run(workoutIds[0], userIds['pkruns'], null, 'Nice bench numbers!').lastInsertRowid;
  insertComment.run(workoutIds[0], userIds['carlielifts'], c1, 'Thanks! Come lift with me sometime.');
  insertComment.run(workoutIds[5], userIds['carlielifts'], null, 'Those deadlifts are insane.');

  // saved workouts (Priscilla saved Carlie's planned upper body day)
  db.prepare('INSERT INTO saved_workouts (user_id, workout_id) VALUES (?, ?)')
    .run(userIds['pkruns'], workoutIds[6]);
});

seed();

console.log('Seed complete.');
console.log(`Users: ${users.length}, Equipment: ${equipment.length}, Exercises: ${exercises.length}, Workouts: ${workouts.length}`);
console.log(`All fake users log in with password: ${PASSWORD}`);
console.log('Emails: ' + users.map(u => u.email).join(', '));