import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env.local");
const schemaPath = path.join(rootDir, "supabase", "schema.sql");

function parseEnv(contents) {
  const env = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    env[key] = value;
  }

  return env;
}

function parseDatabaseUrl(databaseUrl) {
  const match = databaseUrl.match(
    /^postgresql:\/\/([^:]+):(.+)@([^:/?#]+):(\d+)\/([^?#]+)$/
  );

  if (!match) {
    throw new Error("DATABASE_URL format is invalid.");
  }

  const [, user, password, host, port, database] = match;

  return {
    user,
    password,
    host,
    port: Number(port),
    database,
  };
}

async function connect(config) {
  const client = new Client({
    ...config,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  return client;
}

async function main() {
  const envContents = await fs.readFile(envPath, "utf8");
  const env = parseEnv(envContents);
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing in .env.local");
  }

  const schemaSql = await fs.readFile(schemaPath, "utf8");
  const parsed = parseDatabaseUrl(databaseUrl);

  let client;

  try {
    client = await connect(parsed);
  } catch (error) {
    const canRetryWithoutBrackets =
      parsed.password.startsWith("[") &&
      parsed.password.endsWith("]") &&
      error instanceof Error &&
      /password authentication failed/i.test(error.message);

    if (!canRetryWithoutBrackets) {
      throw error;
    }

    client = await connect({
      ...parsed,
      password: parsed.password.slice(1, -1),
    });
  }

  try {
    await client.query(schemaSql);

    const { rows } = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'schools',
          'users',
          'classes',
          'students',
          'feedback',
          'teacher_evaluations',
          'student_evaluations'
        )
      order by table_name;
    `);

    console.log("Schema applied successfully.");
    console.log(
      `Verified tables: ${rows.map((row) => row.table_name).join(", ")}`
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
