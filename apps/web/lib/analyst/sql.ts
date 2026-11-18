import { PrismaClient } from "@prisma/client";

/**
 * Read-only SQL for the analyst agent.
 *
 * It connects as a separate PostgreSQL role (ANALYST_DATABASE_URL) that can
 * only SELECT, and cannot read the columns holding credentials (the YouTube
 * Music cookie and the Last.fm session key): see the role definition in
 * CLAUDE.md. The transaction below is read-only and time-limited as well, so
 * a mistake in the role cannot turn a question into a write.
 */

const MAX_ROWS = 50;
const MAX_CHARS = 12_000;

let client: PrismaClient | null = null;

function analystClient(): PrismaClient {
  const url = process.env.ANALYST_DATABASE_URL;
  if (!url) throw new Error("ANALYST_DATABASE_URL is not set");
  client ??= new PrismaClient({ datasourceUrl: url });
  return client;
}

export function isAnalystConfigured(): boolean {
  return Boolean(process.env.ANALYST_DATABASE_URL);
}

/** JSON that survives BigInt (COUNT) and Decimal values. */
function serialize(rows: unknown[]): string {
  return JSON.stringify(rows, (_key, value) =>
    typeof value === "bigint" ? Number(value) : value,
  );
}

export async function runReadOnlyQuery(
  sql: string,
): Promise<{ ok: boolean; result: string }> {
  const query = sql.trim().replace(/;\s*$/, "");
  if (!query) return { ok: false, result: "Empty query." };
  if (query.includes(";")) {
    return { ok: false, result: "One statement per call, please." };
  }

  try {
    const rows = await analystClient().$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '8s'");
      return tx.$queryRawUnsafe<unknown[]>(query);
    });
    const shown = rows.slice(0, MAX_ROWS);
    let result = serialize(shown);
    if (rows.length > MAX_ROWS) {
      result += `\n(${rows.length} rows, only the first ${MAX_ROWS} shown: aggregate or add LIMIT)`;
    }
    if (result.length > MAX_CHARS) {
      result = `${result.slice(0, MAX_CHARS)}\n(output cut: select fewer columns or rows)`;
    }
    return { ok: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Prisma wraps the database error in a long message; keep the useful end.
    return { ok: false, result: message.slice(-800) };
  }
}
