# Tutorial Deploy — Jurnal 7 KAIH

Urutannya penting — ikuti dari atas ke bawah, jangan loncat ke "Deploy" sebelum setup Google OAuth2 & D1 selesai, karena keduanya jadi prasyarat environment variable yang dibutuhkan saat build.

---

## 0. Prasyarat

- Node.js 20+ terinstall di laptopmu (Lenovo Legion Pro 5).
- Akun Cloudflare (gratis).
- Akun Google pribadi yang 15GB-nya mau dipakai (BUKAN akun belajar.id, sesuai keputusan kita).
- Repo GitHub untuk project ini (boleh private).
- Domain `jurnal7kaih.xyz` yang sudah kamu punya.

```bash
npm install -g wrangler
wrangler login
```

---

## 1. Setup Google OAuth2 (paling sering bikin gagal kalau dilewat)

1. Buka [Google Cloud Console](https://console.cloud.google.com) → buat project baru, misal `jurnal7kaih`.
2. Aktifkan **Google Drive API** (menu "APIs & Services" → "Library" → cari "Google Drive API" → Enable).
3. Buka "APIs & Services" → **OAuth consent screen**:
   - User type: **External**.
   - Scopes: tambahkan `https://www.googleapis.com/auth/drive.file` SAJA — jangan scope `drive` penuh.
   - **WAJIB**: ubah Publishing status ke **"In production"** (bukan "Testing"). Kalau dibiarkan Testing, refresh token expired tiap 7 hari dan upload akan diam-diam berhenti.
4. Buka "Credentials" → "Create Credentials" → **OAuth client ID** → tipe "Web application". Catat `Client ID` dan `Client Secret`.
5. Generate refresh token dengan [OAuth 2.0 Playground](https://developers.google.com/oauthplayground):
   - Klik ikon gear (kanan atas) → centang "Use your own OAuth credentials" → isi Client ID & Secret dari langkah 4.
   - Di kolom "Step 1", cari & pilih scope **Drive API v3 → `https://www.googleapis.com/auth/drive.file`**.
   - Klik "Authorize APIs", login pakai akun Google pribadimu, izinkan akses.
   - Di "Step 2", klik **"Exchange authorization code for tokens"** — catat `refresh_token` yang muncul.
6. Buat satu folder khusus di Drive akun itu (misal "Bukti Jurnal 7 KAIH"), set sharing-nya **restricted** (jangan "Anyone with the link"). Ambil ID folder dari URL-nya (`drive.google.com/drive/folders/INI_ID_NYA`).

Simpan 4 nilai ini, dipakai di langkah 4 nanti: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID`.

---

## 2. Setup Cloudflare D1 (database)

```bash
wrangler d1 create jurnal7kaih-db
```

Command ini akan mengeluarkan `database_id`. **Copy ID itu**, lalu paste ke `wrangler.toml` (project utama) DAN `cleanup-worker/wrangler.toml` — kedua project ini harus menunjuk ke `database_id` yang SAMA, karena cleanup worker membaca tabel `jurnal_entry_photos` yang ditulis oleh project utama.

Lalu jalankan skema:

```bash
npm run db:migrate:remote
```

---

## 3. Set Secrets di Cloudflare Pages

```bash
wrangler pages secret put GOOGLE_CLIENT_ID --project-name=jurnal7kaih
wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name=jurnal7kaih
wrangler pages secret put GOOGLE_REFRESH_TOKEN --project-name=jurnal7kaih
wrangler pages secret put GOOGLE_DRIVE_FOLDER_ID --project-name=jurnal7kaih
wrangler pages secret put AUTH_SECRET --project-name=jurnal7kaih
```

Untuk `AUTH_SECRET`, generate string random dulu: `openssl rand -base64 32`, lalu paste hasilnya saat diminta.

Setiap command akan minta kamu paste value-nya secara interaktif — ini lebih aman daripada nulis di `wrangler.toml` (yang bisa ke-commit ke git tanpa sengaja).

---

## 4. Install & Build Project Utama

```bash
npm install
npm run build
npm run pages:build
```

Kalau build sukses tanpa error, lanjut ke deploy.

---

## 5. Deploy ke Cloudflare Pages

**Cara pertama kali (buat project):**
```bash
wrangler pages project create jurnal7kaih
npm run deploy
```

**Untuk update berikutnya**, cukup:
```bash
npm run deploy
```

Atau, lebih nyaman untuk jangka panjang: hubungkan repo GitHub-mu ke Cloudflare Pages lewat dashboard (Workers & Pages → Create → Pages → Connect to Git) supaya setiap `git push` otomatis trigger build & deploy. Build command: `npm run pages:build`, output directory: `.vercel/output/static`.

---

## 6. Sambungkan Domain `jurnal7kaih.xyz`

1. Di Cloudflare Dashboard → pilih project Pages `jurnal7kaih` → tab **Custom domains** → "Set up a custom domain".
2. Masukkan `jurnal7kaih.xyz`, ikuti instruksi DNS (kalau domain sudah di Cloudflare, ini otomatis; kalau belum, perlu update nameserver dulu ke Cloudflare).
3. Tunggu propagasi DNS (biasanya beberapa menit, kadang sampai 24 jam).

---

## 7. Deploy Worker Cleanup (terpisah dari project utama)

```bash
cd cleanup-worker
npm install
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_REFRESH_TOKEN
npm run deploy
```

Cek apakah cron-nya terdaftar dengan benar:
```bash
wrangler deployments list
```

Untuk tes manual tanpa menunggu tanggal 1 bulan depan:
```bash
wrangler dev --test-scheduled
# lalu di terminal lain:
curl "http://localhost:8787/__scheduled?cron=0+0+1+*+*"
```

---

## 8. Import Data Siswa Pertama Kali

1. Siapkan file Excel dengan kolom: `NISN`, `Nama`, `Kelas`, `Nama Guru Wali`.
2. Buka `https://jurnal7kaih.xyz/admin`, upload file itu, cek preview, klik "Konfirmasi & Import".
3. Password awal tiap siswa otomatis jadi NISN mereka sendiri (sudah di-hash di database, bukan plaintext).

---

## 9. Checklist Sebelum Benar-Benar Live ke 700 Siswa

- [ ] Buat halaman `/ganti-password` (dirujuk di Login, belum dibuat)
- [ ] Buat jalur login terpisah untuk guru/admin (saat ini cuma siswa yang punya provider Auth.js)
- [ ] Tambahkan cek role admin di `app/api/admin/import-siswa/route.ts` — saat ini endpoint itu masih terbuka untuk siapa saja yang tahu URL-nya
- [ ] Tambahkan kompresi gambar di klien sebelum upload (`browser-image-compression`)
- [ ] Tes alur lengkap dengan minimal 1 akun siswa dan 1 akun guru wali sebelum import 700 data sungguhan
- [ ] Backup `schema.sql` dan `.env`/secrets di tempat aman (password manager, bukan di repo)

---

## Troubleshooting Cepat

| Gejala | Kemungkinan Sebab |
|---|---|
| Login gagal terus padahal NISN benar | `AUTH_SECRET` belum di-set, atau database belum di-migrate |
| Upload foto error 502 | Refresh token Google expired (cek Publishing status = Production?) |
| Cron cleanup tidak jalan | `database_id` di `cleanup-worker/wrangler.toml` beda dengan project utama |
| Build gagal di `next-on-pages` | Cek `compatibility_flags = ["nodejs_compat"]` ada di `wrangler.toml` |
