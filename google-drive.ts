/**
 * Helper Google Drive — pakai fetch langsung ke REST API, BUKAN SDK `googleapis`.
 * Alasan: SDK googleapis bergantung pada Node.js API yang tidak didukung penuh
 * di runtime edge Cloudflare Pages/Workers. Fetch manual = kompatibel & ringan.
 *
 * WAJIB di environment variables (jangan hardcode):
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN   (refresh token akun pribadi, BUKAN service account)
 * - GOOGLE_DRIVE_FOLDER_ID (folder restricted, bukan "anyone with link")
 *
 * Ingat: OAuth consent screen HARUS status "Production" + scope `drive.file`
 * saja, atau refresh token akan expired tiap 7 hari (lihat catatan di
 * stitch-prompt-jurnal7kaih.md).
 */

type DriveEnv = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  GOOGLE_DRIVE_FOLDER_ID: string;
};

async function getAccessToken(env: DriveEnv): Promise<string> {
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

  if (!res.ok) {
    throw new Error(`Gagal refresh token Google OAuth2: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Upload satu file foto ke folder Drive yang sudah ditentukan. */
export async function uploadPhotoToDrive(
  env: DriveEnv,
  file: Blob,
  fileName: string
): Promise<string> {
  const accessToken = await getAccessToken(env);

  const metadata = {
    name: fileName,
    parents: [env.GOOGLE_DRIVE_FOLDER_ID],
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!res.ok) {
    throw new Error(`Upload ke Drive gagal: ${await res.text()}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}

/** Hapus satu file dari Drive berdasarkan ID. Dipakai oleh worker cleanup. */
export async function deletePhotoFromDrive(
  env: DriveEnv,
  driveFileId: string
): Promise<boolean> {
  const accessToken = await getAccessToken(env);

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 404 dianggap "sudah tidak ada" — tetap aman dianggap berhasil dibersihkan.
  return res.ok || res.status === 404;
}
