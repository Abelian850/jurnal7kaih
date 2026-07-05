import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { auth } from "@/auth";
import { uploadPhotoToDrive } from "@/lib/google-drive";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const habitKey = formData.get("habitKey") as string | null;

  if (!file || !habitKey) {
    return NextResponse.json({ error: "file dan habitKey wajib dikirim" }, { status: 400 });
  }

  // Validasi dasar — kompresi sesungguhnya dilakukan di klien sebelum kirim
  // (browser-image-compression), ini cuma guard tambahan di server.
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran foto maksimal 2MB" }, { status: 400 });
  }

  const { env } = getRequestContext();
  const fileName = `${session.user.id}_${habitKey}_${Date.now()}.jpg`;

  try {
    const driveFileId = await uploadPhotoToDrive(
      env as unknown as Parameters<typeof uploadPhotoToDrive>[0],
      file,
      fileName
    );
    return NextResponse.json({ driveFileId });
  } catch (err) {
    return NextResponse.json(
      { error: "Upload ke Drive gagal", detail: String(err) },
      { status: 502 }
    );
  }
}
