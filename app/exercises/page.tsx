import { wilsonExerciseNames } from "@/lib/wilson-exercises";
import db from "@/lib/db";

export const instant = false;

type Exercise = {
  id: number;
  name: string;
  description: string | null;
  muscle_group: string;
  equipment_type: string;
  equipment_name: string | null;
};

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    muscle?: string;
    type?: string;
  }>;
}) {
  const params = await searchParams;

  const search = params.search ?? "";
  const muscle = params.muscle ?? "";
  const type = params.type ?? "";

  
const exercises = db.prepare(`
    SELECT
    ex.id,
    ex.name,
    ex.description,
    ex.muscle_group,
    ex.equipment_type,
    eq.name AS equipment_name,
    eq.id AS equipment_id
    FROM exercises ex
    LEFT JOIN equipment eq ON ex.equipment_id = eq.id
    WHERE ex.name IN (
    SELECT value FROM json_each(?)
    )
    AND ex.name LIKE ?
    AND (? = '' OR LOWER(ex.muscle_group) = ?)
    AND (? = '' OR LOWER(ex.equipment_type) = ?)
    ORDER BY ex.name
    `).all(
    JSON.stringify(wilsonExerciseNames),
    `%${search}%`,
    muscle,
    muscle,
    type,
    type
) as Exercise[];

const muscles = db.prepare(`
    SELECT DISTINCT LOWER(muscle_group) AS muscle_group
    FROM exercises
    WHERE name IN (SELECT value FROM json_each(?))
    ORDER BY muscle_group
    `).all(
    JSON.stringify(wilsonExerciseNames)
) as { muscle_group: string }[];

const types = db.prepare(`
    SELECT DISTINCT LOWER(equipment_type) AS equipment_type
    FROM exercises
    WHERE name IN (SELECT value FROM json_each(?))
    ORDER BY equipment_type
    `).all(
    JSON.stringify(wilsonExerciseNames)
) as { equipment_type: string }[];

  return (
    <main style={{ padding: "40px" }}>
      <h1>Wilson Recreation Center Exercise Library</h1>
      <p>Find exercises by name, muscle group, or equipment type.</p>

      <form
        action="/exercises"
        method="GET"
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "24px",
          flexWrap: "wrap",
        }}
      >
        <input
          name="search"
          placeholder="Search exercises..."
          defaultValue={search}
          style={{ padding: "10px", border: "1px solid gray" }}
        />

        <select name="muscle" defaultValue={muscle}>
          <option value="">All muscle groups</option>
          {muscles.map((m) => (
            <option key={m.muscle_group} value={m.muscle_group}>
              {m.muscle_group
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </option>
          ))}
        </select>

        <select name="type" defaultValue={type}>
          <option value="">All equipment types</option>
          {types.map((t) => (
            <option key={t.equipment_type} value={t.equipment_type}>
              {t.equipment_type
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </option>
          ))}
        </select>

        <button type="submit" style={{ padding: "10px 20px" }}>
          Search
        </button>
      </form>

      <h2 style={{ marginTop: "30px" }}>
        Exercise Directory ({exercises.length})
      </h2>

      {exercises.length === 0 && (
        <p>No exercises match your search.</p>
      )}

      {exercises.map((exercise) => (
        <div
          key={exercise.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "15px",
          }}
        >
          <h3>{exercise.name}</h3>
          <p>Muscle group: {exercise.muscle_group}</p>
          <p>Equipment type: {exercise.equipment_type}</p>
          <p>Equipment: {exercise.equipment_name ?? "None specified"}</p>
          {exercise.description && <p>{exercise.description}</p>}
        </div>
      ))}
    </main>
  );
}
