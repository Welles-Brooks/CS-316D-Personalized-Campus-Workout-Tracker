import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { account, ApiError, body, handle, json, password, text } from '@/lib/profile-api';

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  return handle(async () => {
    const { action } = await context.params;
    const input = await body(request);
    const session = await getSession();
    if (action === 'logout') { session.destroy(); return json({ success: true }); }
    if (action === 'register') {
      const fields = account(input);
      const candidate = password(input.password);
      if (db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE').get(fields.email, fields.username)) throw new ApiError(409, 'Email or username already in use.');
      const hash = await bcrypt.hash(candidate, 10);
      const result = db.prepare('INSERT INTO users (email, username, full_name, address, avatar, password_hash) VALUES (@email, @username, @full_name, @address, @avatar, @hash)').run({ ...fields, hash });
      session.userId = Number(result.lastInsertRowid);
      await session.save();
      return json({ success: true }, 201);
    }
    if (action === 'login') {
      const email = text(input.email, 'Email', 254).toLowerCase();
      const candidate = input.password;
      if (typeof candidate !== 'string' || !candidate || candidate.length > 1024) throw new ApiError(400, 'Enter a password.');
      const user = db.prepare('SELECT id, password_hash FROM users WHERE email = ? COLLATE NOCASE').get(email) as { id: number; password_hash: string } | undefined;
      if (!user || !await bcrypt.compare(candidate, user.password_hash)) throw new ApiError(401, 'Incorrect email or password.');
      session.userId = user.id;
      await session.save();
      return json({ success: true });
    }
    throw new ApiError(404, 'Unknown authentication endpoint.');
  });
}
