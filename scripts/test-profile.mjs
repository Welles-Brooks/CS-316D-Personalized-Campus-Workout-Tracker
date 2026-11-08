// Run against a development server using a disposable FITNESS_DB_PATH database.
import assert from 'node:assert/strict';
const base = process.env.PROFILE_TEST_URL || 'http://localhost:3001';
const suffix = Date.now();
let cookie = '';
async function request(path, method = 'GET', data, expected = 200, authenticated = true) {
  const response = await fetch(base + path, { method, headers: {
    ...(authenticated && cookie ? { Cookie: cookie } : {}),
    ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
  }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const result = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
  if (authenticated && response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  return result;
}
await request('/api/profile', 'GET', undefined, 401);
await request('/api/profile/workouts', 'GET', undefined, 401);
await request('/api/profile/saved-workouts', 'GET', undefined, 401);
await request('/api/profile', 'PATCH', {}, 401);
await request('/api/profile/password', 'PATCH', {}, 401);
await request('/api/auth/register', 'POST', { email: 'bad' }, 400);
const account = { email: `profile-${suffix}@example.com`, username: `profile_${suffix}`, full_name: 'Profile Test', address: 'Hollows', password: ' password123 ' };
await request('/api/auth/register', 'POST', { ...account, address: '' }, 400);
await request('/api/auth/register', 'POST', { ...account, address: 'Unlisted residence' }, 400);
await request('/api/auth/register', 'POST', account, 201);
const { user } = await request('/api/profile');
assert.equal(user.email, account.email);
assert.equal(user.password_hash, undefined);
assert.equal(user.address, 'Hollows');
assert.equal(user.avatar, 'avery');
await request('/api/profile', 'PATCH', { ...account, address: '' }, 400);
await request('/api/profile', 'PATCH', { ...account, avatar: 'unknown' }, 400);
const offCampus = await request('/api/profile', 'PATCH', { ...account, address: 'Off-campus', avatar: 'jordan' });
assert.equal(offCampus.user.address, 'Off-campus');
assert.equal(offCampus.user.avatar, 'jordan');
await request('/api/auth/register', 'POST', { ...account, email: account.email.toUpperCase() }, 409);
await request('/api/profile', 'PATCH', { ...account, preferred_workout_minutes: -5 }, 400);
const updated = await request('/api/profile', 'PATCH', { ...account, id: 999999, avatar: 'sage', full_name: 'Updated Name', fitness_goals: 'Build strength', experience_level: 'Beginner', preferred_workout_minutes: 45, workouts_per_week: 3 });
assert.equal(updated.user.id, user.id);
assert.equal(updated.user.full_name, 'Updated Name');
assert.equal((await request('/api/profile')).user.avatar, 'sage');
assert.equal((await request('/api/profile')).user.workouts_per_week, 3);
assert.deepEqual((await request('/api/profile/workouts')).workouts, []);
assert.deepEqual((await request('/api/profile/saved-workouts')).workouts, []);
await request('/api/profile/password', 'PATCH', { current_password: 'wrong', new_password: 'newpassword123' }, 400);
await request('/api/profile/password', 'PATCH', { current_password: account.password, new_password: 'newpassword123' });
await request('/api/auth/logout', 'POST', {});
await request('/api/profile', 'GET', undefined, 401);
await request('/api/auth/login', 'POST', { email: account.email, password: account.password }, 401);
await request('/api/auth/login', 'POST', { email: account.email, password: 'newpassword123' });
assert.equal((await request('/api/profile')).user.id, user.id);
await request('/api/auth/login', 'POST', { email: 'carlie@gmail.com', password: 'password123' });
const history = (await request('/api/profile/workouts')).workouts;
assert.equal(history.length, 3);
assert.ok(history.every(w => w.user_id !== user.id && w.is_template === 0 && w.exercises.length));
assert.deepEqual(history.map(w => w.date), [...history.map(w => w.date)].sort().reverse());
await request('/api/auth/login', 'POST', { email: 'pk@gmail.com', password: 'password123' });
assert.equal((await request('/api/profile/workouts')).workouts.length, 2);
assert.equal((await request('/api/profile/saved-workouts')).workouts.length, 1);
await request('/api/profile', 'PATCH', { ...account, email: 'CARLIE@gmail.com' }, 409);
for (const page of ['/login', '/register', '/profile', '/profile/edit', '/profile/security', '/history']) {
  const response = await fetch(base + page);
  assert.equal(response.status, 200, page);
}
console.log('Profile integration checks passed: authentication, validation, account isolation, required Duke residence, off-campus selection, avatar persistence, immutable ID, password changes, history, saved workouts, and page rendering.');
