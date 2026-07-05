"use client";

import { useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";

/**
 * Panel Admin — Jurnal 7 KAIH
 *
 * Alur: admin pilih file Excel -> di-parse di KLIEN dulu untuk preview
 * (supaya admin bisa cek sebelum kirim) -> baru file yang sama dikirim utuh
 * ke /api/admin/import-siswa untuk diproses & disimpan ke D1.
 *
 * Format kolom Excel yang diharapkan: NISN | Nama | Kelas | Nama Guru Wali
 */

type PreviewRow = {
  NISN: string | number;
  Nama: string;
  Kelas: string;
  "Nama Guru Wali": string;
};

type ImportResult = {
  imported: number;
  totalRows: number;
  errors: string[];
};

export default function PanelAdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setResult(null);
    setPreviewError(null);

    try {
      const buffer = await selected.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<PreviewRow>(sheet);

      if (rows.length === 0) {
        setPreviewError("File Excel kosong atau format kolom tidak sesuai.");
        return;
      }
      setPreview(rows.slice(0, 10)); // tampilkan 10 baris pertama saja untuk preview
    } catch {
      setPreviewError("Gagal membaca file. Pastikan formatnya .xlsx atau .csv.");
    }
  }

  async function handleConfirmImport() {
    if (!file) return;
    setIsImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/import-siswa", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as ImportResult;
      setResult(data);
    } catch {
      setResult({ imported: 0, totalRows: 0, errors: ["Gagal terhubung ke server."] });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-container-margin md:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-institution-blue mb-1">
          Panel Admin
        </h1>
        <p className="text-on-surface-variant text-body-md font-body-md mb-6">
          Import data siswa massal dari Excel.
        </p>

        {/* Upload */}
        <div className="bg-surface-white rounded-xl shadow-sm p-card-padding border border-outline-variant mb-6">
          <h2 className="font-title-md text-title-md text-institution-blue mb-3">
            Import Data Siswa
          </h2>
          <p className="text-label-sm text-on-surface-variant mb-4">
            Kolom wajib: <code className="bg-surface-container-low px-1 rounded">NISN</code>,{" "}
            <code className="bg-surface-container-low px-1 rounded">Nama</code>,{" "}
            <code className="bg-surface-container-low px-1 rounded">Kelas</code>,{" "}
            <code className="bg-surface-container-low px-1 rounded">Nama Guru Wali</code>
          </p>

          <label className="border-2 border-dashed border-outline-variant rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-institution-blue transition-colors">
            <span className="material-symbols-outlined text-institution-blue text-[32px] mb-2">
              upload_file
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              {file ? file.name : "Klik untuk pilih file .xlsx atau .csv"}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {previewError && (
            <p className="text-error text-label-md mt-3">{previewError}</p>
          )}
        </div>

        {/* Preview */}
        {preview.length > 0 && !result && (
          <div className="bg-surface-white rounded-xl shadow-sm p-card-padding border border-outline-variant mb-6">
            <h3 className="font-title-md text-title-md text-institution-blue mb-3">
              Preview (10 baris pertama)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-md">
                <thead>
                  <tr className="text-label-sm text-on-surface-variant border-b border-outline-variant">
                    <th className="py-2 pr-4">NISN</th>
                    <th className="py-2 pr-4">Nama</th>
                    <th className="py-2 pr-4">Kelas</th>
                    <th className="py-2 pr-4">Guru Wali</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-outline-variant/50">
                      <td className="py-2 pr-4">{row.NISN}</td>
                      <td className="py-2 pr-4">{row.Nama}</td>
                      <td className="py-2 pr-4">{row.Kelas}</td>
                      <td className="py-2 pr-4">{row["Nama Guru Wali"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="mt-4 bg-institution-blue text-on-primary px-5 py-3 rounded-lg font-label-md text-label-md font-semibold disabled:opacity-60"
            >
              {isImporting ? "Mengimpor…" : "Konfirmasi & Import Semua Data"}
            </button>
          </div>
        )}

        {/* Hasil import */}
        {result && (
          <div className="bg-surface-white rounded-xl shadow-sm p-card-padding border border-outline-variant">
            <h3 className="font-title-md text-title-md text-institution-blue mb-2">Hasil Import</h3>
            <p className="text-body-md text-on-surface mb-3">
              Berhasil mengimpor{" "}
              <span className="font-bold text-success-green">{result.imported}</span> dari{" "}
              {result.totalRows} baris.
            </p>
            {result.errors.length > 0 && (
              <div className="bg-error-container/30 rounded-lg p-4">
                <p className="text-label-md font-semibold text-error mb-2">
                  {result.errors.length} baris dilewati:
                </p>
                <ul className="text-label-sm text-on-error-container list-disc pl-5 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
