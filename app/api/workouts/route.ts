import { body, handle, json, requireUser } from '@/lib/profile-api';
import { insertWorkout, saveAsTemplate, validateWorkout } from '@/lib/workouts-api';

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input: any = await body(request);
    const isTemplate = input.is_template === true;
    const id = insertWorkout(user.id, validateWorkout(input, isTemplate), isTemplate);
    const template = !isTemplate && input.save_as_template === true ? saveAsTemplate(id, user.id) : null;
    return json({ id, template }, 201);
  });
}