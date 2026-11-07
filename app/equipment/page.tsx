import Link from "next/link";

export const instant = false;

import db from "@/lib/db";

type Equipment = {
  id: number;
  name: string;
  type: string;
  description: string | null;
};

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    type?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const type = params.type ?? "";

  const equipment = db
    .prepare(
      `SELECT *
       FROM equipment
       WHERE name LIKE ?
         AND (? = '' OR type = ?)
       ORDER BY name`
    )
    .all(`%${search}%`, type, type) as Equipment[];

  const categories = db
    .prepare("SELECT DISTINCT type FROM equipment ORDER BY type")
    .all() as { type: string }[];

  return (
    <main style={{ padding: "40px" }}>
      <h1>Wilson Recreation Center Equipment</h1>
      <p>Browse and search the equipment available at Wilson.</p>

      <form
        action="/equipment"
        method="GET"
        style={{ display: "flex", gap: "12px", marginTop: "24px" }}
      >
        <input
          type="text"
          name="search"
          placeholder="Search equipment..."
          defaultValue={search}
          style={{ padding: "10px", border: "1px solid gray" }}
        />

        <select
          name="type"
          defaultValue={type}
          style={{ padding: "10px", border: "1px solid gray" }}
        >
          <option value="">All equipment types</option>
          {categories.map((category) => (
            <option key={category.type} value={category.type}>
              {category.type}
            </option>
          ))}
        </select>

        <button type="submit" style={{ padding: "10px 20px" }}>
          Search
        </button>
      </form>

      <h2 style={{ marginTop: "30px" }}>
        Equipment Directory ({equipment.length})
      </h2>

      {equipment.length === 0 && (
        <p>No equipment matches your search.</p>
      )}

      {equipment.map((item) => (
        <div
          key={item.id}
          style={{
            padding: "15px",
            marginTop: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h3>
         <Link href={`/equipment/${item.id}`}>
            {item.name}
        </Link>
        </h3>
          <p>Type: {item.type}</p>
          <p>{item.description}</p>
        </div>
      ))}
    </main>
  );
}
