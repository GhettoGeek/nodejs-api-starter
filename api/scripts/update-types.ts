/**
 * Generates TypeScript types from a PostgreSQL database schema.
 *
 * @copyright 2016-present Kriasoft (https://git.io/vMINh)
 */

import fs from "fs";
import path from "path";
import { camelCase, upperFirst } from "lodash";

import "env";
import db from "../src/db";

function singular(word: string): string {
  return word.endsWith("ies")
    ? `${word.substring(0, word.length - 3)}y`
    : word.endsWith("es")
    ? `${word.substring(0, word.length - 2)}y`
    : word.endsWith("s")
    ? word.substring(0, word.length - 1)
    : word;
}

async function updateTypes(): Promise<void> {
  const lines: string[] = [];

  // Fetch the list of custom enum types
  const enums: Array<{ key: string; name: string; value: string }> = await db
    .table("pg_type")
    .join("pg_enum", "pg_enum.enumtypid", "pg_type.oid")
    .orderBy("pg_type.typname")
    .orderBy("pg_enum.enumsortorder")
    .select("pg_type.typname as key", "pg_enum.enumlabel as value")
    .then((rows) =>
      rows.map((x) => ({ ...x, name: upperFirst(camelCase(x.key)) })),
    );

  // Construct TypeScript enum types
  enums.forEach((x, i) => {
    if (enums[i - 1]?.key !== x.key) {
      lines.push(`export enum ${x.name} {`);
    }
    const key = x.value.replace(/[.-]/g, "_");
    lines.push(`  ${key} = "${x.value}",`);
    if (enums[i + 1]?.key !== x.key) {
      lines.push("}\n");
    }
  });

  // Fetch the list of tables/columns
  const columns = await db
    .withSchema("information_schema")
    .table("columns")
    .where("table_schema", "public")
    .whereNotIn("table_name", ["migrations", "migrations_lock"])
    .orderBy("table_name")
    .orderBy("ordinal_position")
    .select(
      "table_name as table",
      "column_name as col",
      "is_nullable as null",
      "data_type as type",
      "udt_name as udt",
    );

  // Construct TypeScript db record types
  columns.forEach((x, i) => {
    if (columns[i - 1]?.table !== x.table) {
      lines.push(`export type ${singular(upperFirst(camelCase(x.table)))} = {`);
    }

    const nullable = x.null === "YES" ? " | null" : "";
    const type = ["integer", "numeric", "decimal"].includes(x.type)
      ? "number"
      : x.type === "boolean"
      ? "boolean"
      : x.type === "jsonb"
      ? "any"
      : x.type === "ARRAY" && x.udt === "_text"
      ? "string[]"
      : x.type.startsWith("timestamp") || x.type === "date"
      ? "Date"
      : x.type === "USER-DEFINED" && enums.some((e) => e.key === x.udt)
      ? enums.find((e) => e.key === x.udt)?.name
      : "string";

    lines.push(`  ${x.col}: ${type}${nullable};`);

    if (columns[i + 1]?.table !== x.table) {
      lines.push("};\n");
    }
  });

  // Update src/db.ts with the type information
  const file = path.resolve(__dirname, "../src/db.ts");
  const source = fs
    .readFileSync(file, "utf8")
    .replace(
      /^export default db;([\s\S]+)/m,
      `export default db;\n\n` +
        `// The TypeScript definitions below are automatically generated.\n` +
        `// Do not touch them, or risk, your modifications being lost.\n\n` +
        `${lines.join("\n")}`,
    );

  fs.writeFileSync(file, source, "utf8");
}

updateTypes()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.destroy());
