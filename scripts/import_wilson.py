
import csv
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "import-data"
DB_PATH = ROOT / "data" / "app.db"


def read_csv(filename):
    with (DATA / filename).open(newline="", encoding="utf-8-sig") as file:
        return list(csv.DictReader(file))


equipment_rows = read_csv("equipment.csv")
exercise_rows = read_csv("exercises.csv")
association_rows = read_csv("exercise_equipment.csv")

# Match original CSV IDs to the existing database IDs.
equipment_ids = {}
exercise_to_equipment = {
    int(row["exercise_id"]): int(row["equipment_id"])
    for row in association_rows
}

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA foreign_keys = ON")

try:
    with conn:
        # Import Wilson equipment.
        for row in equipment_rows:
            name = row["name"].strip()
            category = row["category"].strip()
            description = row["description"] or None

            existing = conn.execute(
                "SELECT id FROM equipment WHERE LOWER(name) = LOWER(?)",
                (name,)
            ).fetchone()

            if existing:
                db_id = existing[0]
                conn.execute(
                    """
                    UPDATE equipment
                    SET type = ?, description = ?
                    WHERE id = ?
                    """,
                    (category, description, db_id)
                )
            else:
                cursor = conn.execute(
                    """
                    INSERT INTO equipment (name, type, description)
                    VALUES (?, ?, ?)
                    """,
                    (name, category, description)
                )
                db_id = cursor.lastrowid

            equipment_ids[int(row["equipment_id"])] = db_id

        # Import exercises and their equipment associations.
        for row in exercise_rows:
            original_id = int(row["exercise_id"])
            equipment_original_id = exercise_to_equipment.get(original_id)

            equipment_id = (
                equipment_ids.get(equipment_original_id)
                if equipment_original_id is not None
                else None
            )

            equipment_type = (
                conn.execute(
                    "SELECT type FROM equipment WHERE id = ?",
                    (equipment_id,)
                ).fetchone()[0]
                if equipment_id is not None
                else "None"
            )

            values = (
                row["description"] or None,
                row["primary_muscle_group"],
                equipment_type,
                equipment_id,
            )

            existing = conn.execute(
                "SELECT id FROM exercises WHERE LOWER(name) = LOWER(?)",
                (row["name"],)
            ).fetchone()

            if existing:
                conn.execute(
                    """
                    UPDATE exercises
                    SET description = ?, muscle_group = ?,
                        equipment_type = ?, equipment_id = ?
                    WHERE id = ?
                    """,
                    (*values, existing[0])
                )
            else:
                conn.execute(
                    """
                    INSERT INTO exercises
                    (name, description, muscle_group,
                     equipment_type, equipment_id)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (row["name"], *values)
                )

    print("Wilson data imported successfully!")
    print(f"Equipment records processed: {len(equipment_rows)}")
    print(f"Exercise records processed: {len(exercise_rows)}")

finally:
    conn.close()
