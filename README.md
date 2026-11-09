# Wilson Fitness

## Setup

1. Install dependencies with `npm install`.
2. Create `.env.local` with `SESSION_SECRET=` followed by a random secret at least 32 characters long.
3. Run `npm run db:init` to create the database tables.
4. Run `npm run db:seed` to load sample records. **This deletes existing records.**
5. Run `npm run dev`, then visit http://localhost:3000/login.

Seed accounts: `carlie@gmail.com`, `pk@gmail.com`, `sola@gmail.com`.
All three use password `password123`.

## User profile

- `/register`: create an account and sign in automatically.
- `/login`: sign in with email and password.
- `/profile`: read-only overview with avatar, residence, fitness goals/preferences, recent workouts, and saved workouts.
- `/profile/edit`: edit account details, required residence, fitness preferences, and preset avatar; Save returns to the overview and Cancel discards edits.
- `/profile/security`: change your password. The account menu also provides logout.
- `/history`: view completed workouts, newest first, with exercise and equipment summaries.

Pages call explicit JSON API endpoints with `fetch`. The session cookie identifies the current user; client-supplied IDs never choose whose profile is accessed or changed. Password hashes are never returned. No public profiles or bonus history filters are implemented.

### API

| Method | Endpoint | Input / response |
| --- | --- | --- |
| POST | `/api/auth/register` | `{email, username, full_name, address, password, avatar?}` → `{success: true}` (201) |
| POST | `/api/auth/login` | `{email, password}` → `{success: true}` |
| POST | `/api/auth/logout` | `{}` → `{success: true}` |
| GET | `/api/profile` | `{user: {id, email, username, full_name, address, avatar, fitness_goals, experience_level, preferred_workout_minutes, workouts_per_week, is_public}}` |
| PATCH | `/api/profile` | Complete editable profile form → `{user: ...}` |
| PATCH | `/api/profile/password` | `{current_password, new_password}` → `{success: true}` |
| GET | `/api/profile/workouts` | `{workouts: [...]}` including exercises, sets, reps, weight, and equipment |
| GET | `/api/profile/saved-workouts` | `{workouts: [...]}` including owned saves and saves from public accounts |

Profile and workout endpoints require authentication (401 otherwise). Invalid fields return 400; duplicate email/username returns 409. Errors have shape `{error: "message"}`. Responses use `Cache-Control: no-store`.

Example profile update JSON:

```json
{
  "email": "carlie@gmail.com",
  "username": "carlielifts",
  "full_name": "Carlie Scheer",
  "address": "Hollows",
  "avatar": "avery",
  "fitness_goals": "Build strength",
  "experience_level": "Intermediate",
  "preferred_workout_minutes": 60,
  "workouts_per_week": 4
}
```

The ID cannot be edited. `address` now stores a required residence selected from the shared Duke housing list or `Off-campus`; arbitrary addresses are rejected. `avatar` is a preset identifier (`avery`, `jordan`, `riley`, `kai`, `sage`, or `alex`). Photo uploads are not supported. Run `npm run db:init` when updating an existing checkout to add the avatar column without deleting records.

Residence choices come from Duke’s [East Campus houses](https://students.duke.edu/living/housing/first-year-housing/east-campus-houses/) and [upperclass housing](https://students.duke.edu/living/housing/upperclass-housing/quad-descriptions/) pages. The API and forms use the same list in `lib/profile-options.ts`.

 Fitness preferences can be blank (`null` for numeric values). Experience level accepts Beginner, Intermediate, or Advanced. Passwords require at least 8 characters and at most 72 UTF-8 bytes, matching bcrypt's input limit.

### Milestone demonstration

1. Log in as Carlie and open `/profile`. Your personal account was updated to Hollows; sample seed residences are defined in `scripts/seed.js`.
2. In browser developer tools, open Network and inspect `GET /api/profile`: this queries SQLite and returns the signed-in user's profile as JSON.
3. Click Edit profile, change your goals or avatar, and save. Inspect `PATCH /api/profile`, then reload to verify persistence.
4. Open History and inspect `GET /api/profile/workouts`. Carlie has three completed sample workouts; the planned template is excluded.
5. Log out and log in as Priscilla (`pk@gmail.com`) to see a different history and a saved workout.
6. Log out and request `/api/profile` to demonstrate the 401 response.

Workout creation, saving/removing workouts, and social interactions belong to the corresponding teammates. This profile implementation reads their shared tables. The seed stores cardio minutes in `reps`; the UI labels recognized cardio records accordingly. Weight is displayed in pounds, matching the seed convention.

## Verification

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

The integration script creates test accounts and changes test data. **Use a disposable database populated by `scripts/seed.js`, never your working database.** It expects the sample accounts above.

For example, create a temporary directory, copy a freshly seeded `data/app.db` into it, and start the test server in one terminal:

```sh
FITNESS_DB_PATH=/absolute/path/to/disposable/app.db npm run dev -- --port 3001
```

In a second terminal:

```sh
node scripts/test-profile.mjs
```

Checks cover anonymous access, registration, duplicate accounts, profile validation and persistence, immutable IDs, required residence, off-campus selection, avatar persistence, password changes, logout, account isolation, history ordering, saved workouts, and page HTTP responses. This is an API integration check; it does not automate browser interaction.

## Database workflow

`db/schema.sql` defines the tables; `data/app.db` holds local records and is ignored by Git. `db:init` creates missing tables but does not migrate existing ones. For disposable development data, recreate the database and reseed after schema changes. Preserve important records before doing so.

## LLM Use

LLMs were used to assist with the implementation of the code. We verified the implementation as we went through local rendering and testing the features.
