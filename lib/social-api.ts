import db from './db';

// Search users (excluding blocked users and self)
export function searchUsers(currentUserId: number, query: string) {
  const searchTerm = `%${query.trim()}%`;
  return db
    .prepare(
      `SELECT id, username, full_name, email, avatar, is_public
       FROM users
       WHERE id != ? 
         AND id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
         AND id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
         AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)
       LIMIT 15`
    )
    .all(currentUserId, currentUserId, currentUserId, searchTerm, searchTerm, searchTerm);
}

// Friend Management (including friend User ID)
export function getFriends(userId: number) {
  return db
    .prepare(
      `SELECT u.id, u.username, u.full_name, u.email, u.avatar, u.is_public
       FROM users u
       JOIN friendships f 
         ON (f.friend_id = u.id AND f.user_id = ?)
         OR (f.user_id = u.id AND f.friend_id = ?)
       WHERE u.id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
       ORDER BY u.full_name ASC`
    )
    .all(userId, userId, userId);
}

export function addFriend(userId: number, friendId: number) {
  return db
    .prepare(
      `INSERT OR IGNORE INTO friendships (user_id, friend_id)
       VALUES (?, ?)`
    )
    .run(userId, friendId);
}

export function removeFriend(userId: number, friendId: number) {
  return db
    .prepare(
      `DELETE FROM friendships 
       WHERE (user_id = ? AND friend_id = ?) 
          OR (user_id = ? AND friend_id = ?)`
    )
    .run(userId, friendId, friendId, userId);
}

// Blocking System
export function blockUser(blockerId: number, blockedId: number) {
  // Remove any existing friendship first
  removeFriend(blockerId, blockedId);
  return db
    .prepare(`INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)`)
    .run(blockerId, blockedId);
}

export function unblockUser(blockerId: number, blockedId: number) {
  return db
    .prepare(`DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?`)
    .run(blockerId, blockedId);
}

export function getBlockedUsers(userId: number) {
  return db
    .prepare(
      `SELECT u.id, u.username, u.full_name, u.avatar
       FROM users u
       JOIN blocks b ON b.blocked_id = u.id
       WHERE b.blocker_id = ?`
    )
    .all(userId);
}

// Privacy Toggle (Public vs Private)
export function updatePrivacy(userId: number, isPublic: boolean) {
  return db
    .prepare(`UPDATE users SET is_public = ? WHERE id = ?`)
    .run(isPublic ? 1 : 0, userId);
}

export function getUserPrivacy(userId: number) {
  const row = db.prepare(`SELECT is_public FROM users WHERE id = ?`).get(userId) as { is_public: number } | undefined;
  return row ? Boolean(row.is_public) : true;
}

// Social Feed (Shows workouts by friends or public profiles, excluding blocked users)
export function getSocialFeed(userId: number) {
  const workouts = db
    .prepare(
      `SELECT w.id, w.user_id, w.date, w.start_time, w.duration_minutes, w.location,
              w.feel, w.effort, w.notes, w.is_template,
              u.full_name as owner_name, u.username as owner_username, u.avatar as owner_avatar,
              u.is_public as owner_is_public
       FROM workouts w
       JOIN users u ON w.user_id = u.id
       WHERE (
         w.user_id = ?
         OR w.user_id IN (
           SELECT friend_id FROM friendships WHERE user_id = ?
           UNION
           SELECT user_id FROM friendships WHERE friend_id = ?
         )
         OR u.is_public = 1
       )
       AND w.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
       AND w.user_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
       ORDER BY w.date DESC, w.id DESC
       LIMIT 25`
    )
    .all(userId, userId, userId, userId, userId);

  return workouts.map((w: any) => {
    const attendees = db
      .prepare(
        `SELECT u.id, u.full_name, u.username 
         FROM workout_attendees a
         JOIN users u ON a.user_id = u.id
         WHERE a.workout_id = ?`
      )
      .all(w.id);

    const exercises = db
      .prepare(
        `SELECT e.name, we.sets, we.reps, we.weight
         FROM workout_exercises we
         JOIN exercises e ON we.exercise_id = e.id
         WHERE we.workout_id = ?`
      )
      .all(w.id);

    const comments = getCommentsForWorkout(w.id, userId);

    return {
      ...w,
      attendees,
      exercises,
      comments,
      user_is_attending: attendees.some((a: any) => a.id === userId),
    };
  });
}

// Comments (filtering out comments by blocked users)
export function getCommentsForWorkout(workoutId: number, currentUserId?: number) {
  let query = `
    SELECT c.id, c.workout_id, c.user_id, c.body, c.created_at, 
           u.full_name as author_name, u.username as author_username, u.avatar as author_avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.workout_id = ?
  `;

  if (currentUserId) {
    query += `
      AND c.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ${Number(currentUserId)})
      AND c.user_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ${Number(currentUserId)})
    `;
  }

  query += ` ORDER BY c.created_at ASC`;
  return db.prepare(query).all(workoutId);
}

export function addComment(workoutId: number, userId: number, body: string, parentCommentId: number | null = null) {
  return db
    .prepare(
      `INSERT INTO comments (workout_id, user_id, body, parent_comment_id)
       VALUES (?, ?, ?, ?)`
    )
    .run(workoutId, userId, body.trim(), parentCommentId);
}

export function getRecentCommentsByUser(userId: number, limit = 5) {
  return db
    .prepare(
      `SELECT c.id, c.workout_id, c.body, c.created_at, w.date as workout_date
       FROM comments c
       JOIN workouts w ON c.workout_id = w.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC
       LIMIT ?`
    )
    .all(userId, limit);
}

// Join Workout Toggle
export function toggleJoinWorkout(workoutId: number, userId: number) {
  const existing = db
    .prepare(`SELECT 1 FROM workout_attendees WHERE workout_id = ? AND user_id = ?`)
    .get(workoutId, userId);

  if (existing) {
    db.prepare(`DELETE FROM workout_attendees WHERE workout_id = ? AND user_id = ?`).run(workoutId, userId);
    return { joined: false };
  } else {
    db.prepare(`INSERT INTO workout_attendees (workout_id, user_id) VALUES (?, ?)`).run(workoutId, userId);
    return { joined: true };
  }
}