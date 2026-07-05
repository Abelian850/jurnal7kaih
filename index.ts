/**
 * Worker terpisah, BUKAN bagian dari project Next.js — Cloudflare Pages
 * Functions tidak mendukung Cron Trigger, jadi cleanup ini harus jadi
 * Worker mandiri yang di-deploy sendiri (lihat wrangler.toml di folder ini).
 *
 * Tugasnya: hapus foto di Drive yang sudah >30 hari DAN belum ditandai
 * is_representative (foto yang mau dicetak guru wali tidak ikut terhapus).
 */

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
}

async function getAccessToken(env: Env): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Gagal refresh token: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const { results } = await env.DB.prepare(
      `SELECT id, drive_file_id FROM jurnal_entry_photos
       WHERE is_representative = 0 AND uploaded_at < ?`
    )
      .bind(cutoffMs)
      .all<{ id: string; drive_file_id: string }>();

    if (!results || results.length === 0) {
      console.log("Cleanup: tidak ada foto yang perlu dihapus bulan ini.");
      return;
    }

    const accessToken = await getAccessToken(env);
    let deletedCount = 0;

    for (const row of results) {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${row.drive_file_id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // 404 dianggap "sudah tidak ada di Drive", tetap aman dibersihkan dari D1.
      if (res.ok || res.status === 404) {
        await env.DB.prepare(`DELETE FROM jurnal_entry_photos WHERE id = ?`)
          .bind(row.id)
          .run();
        deletedCount++;
      } else {
        console.error(`Gagal hapus ${row.drive_file_id}: ${await res.text()}`);
      }
    }

    console.log(`Cleanup selesai: ${deletedCount}/${results.length} foto dihapus.`);
  },
};
