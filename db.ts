import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * D1Database didapat dari binding Cloudflare (lihat wrangler.toml).
 * Di Next.js (App Router) di atas @cloudflare/next-on-pages, ambil lewat:
 *
 *   import { getRequestContext } from "@cloudflare/next-on-pages";
 *   const { env } = getRequestContext();
 *   const db = getDb(env.DB);
 */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
