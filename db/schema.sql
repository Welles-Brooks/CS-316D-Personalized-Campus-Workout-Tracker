CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'avery',
  password_hash TEXT NOT NULL,
  fitness_goals TEXT,
  experience_level TEXT,
  preferred_workout_minutes INTEGER,
  workouts_per_week INTEGER,
  is_public INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,            -- cardio / strength machine / free weights
  description TEXT
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  equipment_id INTEGER REFERENCES equipment(id)
);

CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,            -- 'YYYY-MM-DD'
  start_time TEXT,
  duration_minutes INTEGER,
  location TEXT,
  feel INTEGER,                  -- 1-10
  effort INTEGER,                -- 1-10
  notes TEXT,
  is_template INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  equipment_id INTEGER REFERENCES equipment(id),
  sets INTEGER, reps INTEGER, weight REAL
);

CREATE TABLE IF NOT EXISTS friendships (
  user_id INTEGER NOT NULL REFERENCES users(id),
  friend_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  parent_comment_id INTEGER REFERENCES comments(id),
  body TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_workouts (
  user_id INTEGER NOT NULL REFERENCES users(id),
  workout_id INTEGER NOT NULL REFERENCES workouts(id),
  PRIMARY KEY (user_id, workout_id)
);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id),
  blocked_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (blocker_id, blocked_id)
);