
import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const instant = false;

type Equipment = {
  id: number;
  name: string;
  type: string;
  description: string | null;
};

type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  description: string | null;
};

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const equipmentId = Number(id);

  if (!Number.isSafeInteger(equipmentId) || equipmentId <= 0) {
    notFound();
  }

  const equipment = db
    .prepare("SELECT * FROM equipment WHERE id = ?")
    .get(equipmentId) as Equipment | undefined;

  if (!equipment) {
    notFound();
  }

  const exercises = db
    .prepare(`
      SELECT id, name, muscle_group, description
      FROM exercises
      WHERE equipment_id = ?
      ORDER BY name
    `)
    .all(equipmentId) as Exercise[];

  return (
    <main style={{ padding: "40px" }}>
      <Link href="/equipment">← Back to Equipment</Link>

      <h1 style={{ marginTop: "24px" }}>
        {equipment.name}
      </h1>

      <p>Equipment type: {equipment.type}</p>

      <h2 style={{ marginTop: "24px" }}>Description</h2>
      <p>
        {equipment.description || "No description available yet."}
      </p>

      <h2 style={{ marginTop: "32px" }}>
        Associated Exercises ({exercises.length})
      </h2>

      {exercises.length === 0 ? (
        <p>No exercises linked to this equipment yet.</p>
      ) : (
        exercises.map((exercise) => (
          <div
            key={exercise.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "12px",
            }}
          >
            <h3>{exercise.name}</h3>
            <p>Muscle group: {exercise.muscle_group}</p>
            {exercise.description && (
              <p>{exercise.description}</p>
            )}
          </div>
        ))
      )}
    </main>
  );
}
