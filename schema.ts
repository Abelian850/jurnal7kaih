import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Skema Jurnal 7 KAIH — SMP Negeri 30 Semarang
 * Drizzle ORM, dialect SQLite (Cloudflare D1)
 */

export const guru = sqliteTable("guru", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
});

export const siswa = sqliteTable("siswa", {
  id: text("id").primaryKey(),
  nisn: text("nisn").notNull().unique(), // juga dipakai sebagai username login
  nama: text("nama").notNull(),
  kelas: text("kelas").notNull(),
  // PENTING: wali ditempel ke siswa, BUKAN ke kelas — satu guru wali bisa
  // membimbing siswa dari kelas yang berbeda-beda.
  waliGuruId: text("wali_guru_id").notNull().references(() => guru.id),
  passwordHash: text("password_hash").notNull(), // awal = hash(NISN)
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(true),
});

// Dikontrol lewat toggle di Dashboard Guru Wali — menentukan kebiasaan mana
// yang mewajibkan siswa bimbingannya upload foto bukti.
export const habitSettings = sqliteTable("habit_settings", {
  id: text("id").primaryKey(),
  waliGuruId: text("wali_guru_id").notNull().references(() => guru.id),
  habitKey: text("habit_key").notNull(), // mis: "bangun_pagi", "tidur_cepat"
  requiresPhoto: integer("requires_photo", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const jurnalEntries = sqliteTable("jurnal_entries", {
  id: text("id").primaryKey(),
  siswaId: text("siswa_id").notNull().references(() => siswa.id),
  tanggal: text("tanggal").notNull(), // format ISO: YYYY-MM-DD
  habitsJson: text("habits_json").notNull(), // status 7 kebiasaan + catatan, disimpan sbg JSON
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Foto TIDAK disimpan di D1 — hanya drive_file_id sebagai referensi.
// File sungguhan ada di Google Drive (lihat lib/google-drive.ts).
export const jurnalEntryPhotos = sqliteTable("jurnal_entry_photos", {
  id: text("id").primaryKey(),
  jurnalEntryId: text("jurnal_entry_id").notNull().references(() => jurnalEntries.id),
  habitKey: text("habit_key").notNull(),
  driveFileId: text("drive_file_id").notNull(),
  // Ditandai true lewat tombol "Tandai untuk cetak" di Dashboard Guru Wali —
  // worker cleanup bulanan akan SKIP foto yang ditandai ini.
  isRepresentative: integer("is_representative", { mode: "boolean" })
    .notNull()
    .default(false),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull(),
});
