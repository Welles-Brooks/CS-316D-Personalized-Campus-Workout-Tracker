
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { wilsonNames } from "@/lib/wilson-equipment";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";

  const equipment = db
    .prepare(
      `SELECT id, name, type, description
       FROM equipment
       WHERE name IN (
         SELECT value FROM json_each(?)
       )
         AND name LIKE ?
         AND (? = '' OR LOWER(type) = LOWER(?))
       ORDER BY name`
    )
    .all(
      JSON.stringify(wilsonNames),
      `%${search}%`,
      type,
      type
    );

  const categories = db
    .prepare(
      `SELECT DISTINCT LOWER(type) AS type
       FROM equipment
       WHERE name IN (
         SELECT value FROM json_each(?)
       )
       ORDER BY type`
    )
    .all(JSON.stringify(wilsonNames));

  return NextResponse.json({
    equipment,
    categories,
  });
}
