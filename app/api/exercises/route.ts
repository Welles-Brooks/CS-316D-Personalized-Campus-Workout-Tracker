import db from '@/lib/db';
import { handle, json, requireUser } from '@/lib/profile-api';

export async function GET() {
  return handle(async () => {
    await requireUser();
    return json({
      exercises: db.prepare('SELECT id, name, muscle_group, equipment_type, equipment_id FROM exercises ORDER BY name').all(),
      equipment: db.prepare('SELECT id, name FROM equipment ORDER BY name').all(),
    });
  });
}