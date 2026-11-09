import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { ApiError, body, handle, json, password, requireUser } from '@/lib/profile-api';
export async function PATCH(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input = await body(request);
    const next = password(input.new_password);
    const stored = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string };
    if (typeof input.current_password !== 'string' || !await bcrypt.compare(input.current_password, stored.password_hash)) throw new ApiError(400, 'Current password is incorrect.');
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await bcrypt.hash(next, 10), user.id);
    return json({ success: true });
  });
}
