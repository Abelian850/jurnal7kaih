import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { habitSettings } from "@/lib/schema";

export const runtime = "edge";

/**
 * TODO: endpoint ini saat ini berasumsi session.user.id ADALAH id guru.
 * Karena Auth.js yang kita buat sebelumnya hanya punya provider untuk siswa
 * (login NISN), guru wali belum punya jalur login sendiri. Sebelum endpoint
 * ini dipakai sungguhan, perlu provider Credentials kedua untuk guru/admin
 * (misal login pakai email+password atau NIP), supaya session.user.id di
 * sini benar-benar merujuk ke baris di tabel `guru`, bukan `siswa`.
 */

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const { habitKey, requiresPhoto } = (await req.json()) as {
    habitKey: string;
    requiresPhoto: boolean;
  };

  if (!habitKey || typeof requiresPhoto !== "boolean") {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const { env } = getRequestContext();
  const db = getDb(env.DB as D1Database);
  const waliGuruId = session.user.id; // lihat TODO di atas

  const existing = await db
    .select()
    .from(habitSettings)
    .where(and(eq(habitSettings.waliGuruId, waliGuruId), eq(habitSettings.habitKey, habitKey)))
    .get();

  if (existing) {
    await db
      .update(habitSettings)
      .set({ requiresPhoto })
      .where(eq(habitSettings.id, existing.id));
  } else {
    await db.insert(habitSettings).values({
      id: nanoid(),
      waliGuruId,
      habitKey,
      requiresPhoto,
    });
  }

  return NextResponse.json({ ok: true });
}
