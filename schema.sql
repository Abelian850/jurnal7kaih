-- Jalankan dengan: npx wrangler d1 execute jurnal7kaih-db --file=./schema.sql
-- (gunakan --remote untuk apply ke database production, tanpa --remote untuk lokal)

CREATE TABLE IF NOT EXISTS guru (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS siswa (
  id TEXT PRIMARY KEY,
  nisn TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  wali_guru_id TEXT NOT NULL REFERENCES guru(id),
  password_hash TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS habit_settings (
  id TEXT PRIMARY KEY,
  wali_guru_id TEXT NOT NULL REFERENCES guru(id),
  habit_key TEXT NOT NULL,
  requires_photo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS jurnal_entries (
  id TEXT PRIMARY KEY,
  siswa_id TEXT NOT NULL REFERENCES siswa(id),
  tanggal TEXT NOT NULL,
  habits_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS jurnal_entry_photos (
  id TEXT PRIMARY KEY,
  jurnal_entry_id TEXT NOT NULL REFERENCES jurnal_entries(id),
  habit_key TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  is_representative INTEGER NOT NULL DEFAULT 0,
  uploaded_at INTEGER NOT NULL
);

-- Index yang dipakai paling sering: cek jurnal hari ini per siswa,
-- dan cari foto lama untuk cleanup bulanan.
CREATE INDEX IF NOT EXISTS idx_jurnal_siswa_tanggal ON jurnal_entries(siswa_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON jurnal_entry_photos(uploaded_at, is_representative);
CREATE INDEX IF NOT EXISTS idx_siswa_wali ON siswa(wali_guru_id);
CREATE INDEX IF NOT EXISTS idx_habit_settings_wali ON habit_settings(wali_guru_id);
