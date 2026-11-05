## Setup
1. `git clone <repo-url>` and `cd` into it
2. `npm install`
3. Create `.env.local` containing:
   SESSION_SECRET=any-random-string-at-least-32-characters-long
4. `npm run db:init`
5. `npm run db:seed`
6. `npm run dev` → open http://localhost:3000

Test users (password for all: `password123`):
carlie@example.com, pk@example.com, sola@example.com

## Workflow
- If schema.sql changes: delete `data/app.db`, then re-run `npm run db:init` and `npm run db:seed`.