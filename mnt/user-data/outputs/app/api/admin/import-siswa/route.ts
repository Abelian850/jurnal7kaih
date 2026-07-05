import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { siswa, guru } from "@/lib/schema";

export const runtime = "edge";

type ExcelRow = {
  NISN: string | number;
  Nama: string;
  Kelas: string;
  "Nama Guru Wali": string;
};

export async function POST(req: NextRequest) {
  // TODO WAJIB sebelum production: cek session di sini, pastikan hanya
  // role admin yang bisa panggil endpoint ini. Belum saya tambahkan karena
  // role-based access belum dibahas — jangan deploy endpoint ini tanpa itu.

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "File Excel tidak ditemukan" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

  const { env } = getRequestContext();
  const db = getDb(env.DB as D1Database);

  const errors: string[] = [];
  let imported = 0;
  const guruCache = new Map<string, string>(); // nama guru -> id, biar tidak query berulang

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2; // +2: baris 1 = header Excel
    const nisn = String(row.NISN ?? "").trim();
    const nama = String(row.Nama ?? "").trim();
    const kelas = String(row.Kelas ?? "").trim();
    const namaGuru = String(row["Nama Guru Wali"] ?? "").trim();

    if (!/^\d{10}$/.test(nisn)) {
      errors.push(`Baris ${rowNum}: NISN tidak valid ("${row.NISN}") — harus 10 digit angka`);
      continue;
    }
    if (!nama || !kelas || !namaGuru) {
      errors.push(`Baris ${rowNum}: Nama, Kelas, atau Nama Guru Wali kosong`);
      continue;
    }

    const existing = await db.select().from(siswa).where(eq(siswa.nisn, nisn)).get();
    if (existing) {
      errors.push(`Baris ${rowNum}: NISN ${nisn} sudah ada, dilewati`);
      continue;
    }

    let waliGuruId = guruCache.get(namaGuru);
    if (!waliGuruId) {
      const existingGuru = await db.select().from(guru).where(eq(guru.nama, namaGuru)).get();
      if (existingGuru) {
        waliGuruId = existingGuru.id;
      } else {
        waliGuruId = nanoid();
        await db.insert(guru).values({ id: waliGuruId, nama: namaGuru });
      }
      guruCache.set(namaGuru, waliGuruId);
    }

    const passwordHash = await bcrypt.hash(nisn, 10); // password awal = NISN sendiri
    await db.insert(siswa).values({
      id: nanoid(),
      nisn,
      nama,
      kelas,
      waliGuruId,
      passwordHash,
      mustChangePassword: true,
    });
    imported++;
  }

  return NextResponse.json({ imported, totalRows: rows.length, errors });
}
