import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { habitSettings, jurnalEntries, jurnalEntryPhotos, siswa } from "@/lib/schema";

export const runtime = "edge";

type HabitPayload = {
  key: string;
  done: boolean;
  note?: string;
  driveFileId?: string; // diisi FE setelah upload sukses lewat /api/upload
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const body = (await req.json()) as { tanggal: string; habits: HabitPayload[] };
  const { tanggal, habits } = body;

  if (!tanggal || !Array.isArray(habits)) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const { env } = getRequestContext();
  const db = getDb(env.DB as D1Database);

  const siswaRow = await db.select().from(siswa).where(eq(siswa.id, session.user.id)).get();
  if (!siswaRow) {
    return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
  }

  // INI YANG PALING PENTING: validasi ulang wajib-foto di server.
  // Jangan percaya status dari klien — klien bisa dimanipulasi lewat DevTools.
  const settings = await db
    .select()
    .from(habitSettings)
    .where(eq(habitSettings.waliGuruId, siswaRow.waliGuruId))
    .all();

  const requiredKeys = settings.filter((s) => s.requiresPhoto).map((s) => s.habitKey);
  const missing = requiredKeys.filter((key) => {
    const h = habits.find((x) => x.key === key);
    return !h?.driveFileId;
  });

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Foto wajib belum lengkap", missing },
      { status: 400 }
    );
  }

  const entryId = nanoid();
  await db.insert(jurnalEntries).values({
    id: entryId,
    siswaId: siswaRow.id,
    tanggal,
    habitsJson: JSON.stringify(habits),
    createdAt: new Date(),
  });

  for (const h of habits) {
    if (h.driveFileId) {
      await db.insert(jurnalEntryPhotos).values({
        id: nanoid(),
        jurnalEntryId: entryId,
        habitKey: h.key,
        driveFileId: h.driveFileId,
        isRepresentative: false,
        uploadedAt: new Date(),
      });
    }
  }

  return NextResponse.json({ ok: true, entryId });
}
