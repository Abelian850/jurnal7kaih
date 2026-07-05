"use client";

import { useMemo, useState } from "react";

/**
 * Dashboard Guru Wali — Jurnal 7 KAIH
 *
 * PENTING: daftar siswa di bawah ini HARUS difilter berdasarkan
 * siswa.wali_guru_id = id guru yang login — BUKAN berdasarkan satu kelas.
 * Makanya kolom "Kelas" tetap ditampilkan per-siswa, karena satu guru wali
 * realistis membimbing siswa dari kelas yang berbeda-beda.
 *
 * Panel "Wajib Bukti Foto" di sini yang menulis ke tabel habit_settings —
 * lihat app/api/admin/habit-settings/route.ts (belum dibuat, lihat catatan
 * di akhir) untuk endpoint penyimpanannya.
 */

const HABIT_LABELS: Record<string, string> = {
  bangun_pagi: "Bangun Pagi",
  beribadah: "Beribadah",
  berolahraga: "Berolahraga",
  makan_sehat: "Makan Sehat",
  gemar_belajar: "Gemar Belajar",
  bermasyarakat: "Bermasyarakat",
  tidur_cepat: "Tidur Cepat",
};

type Siswa = {
  id: string;
  nama: string;
  kelas: string;
  sudahIsiHariIni: boolean;
};

// Contoh data — ganti dengan fetch dari D1: SELECT * FROM siswa WHERE wali_guru_id = ?
const MOCK_SISWA: Siswa[] = [
  { id: "1", nama: "Ahmad Fauzi", kelas: "9A", sudahIsiHariIni: true },
  { id: "2", nama: "Siti Rahmawati", kelas: "8C", sudahIsiHariIni: true },
  { id: "3", nama: "Budi Santoso", kelas: "9A", sudahIsiHariIni: false },
  { id: "4", nama: "Dewi Lestari", kelas: "7B", sudahIsiHariIni: false },
];

// Habit yang berkaitan dengan ruang/waktu privat siswa — kalau diwajibkan
// foto, tampilkan peringatan (lihat diskusi privasi sebelumnya).
const PRIVATE_HABITS = new Set(["bangun_pagi", "tidur_cepat"]);

export default function DashboardGuruWaliPage() {
  const [search, setSearch] = useState("");
  const [habitSettings, setHabitSettings] = useState<Record<string, boolean>>({
    bangun_pagi: true,
    beribadah: false,
    berolahraga: false,
    makan_sehat: false,
    gemar_belajar: false,
    bermasyarakat: false,
    tidur_cepat: true,
  });
  const [savingHabit, setSavingHabit] = useState<string | null>(null);

  const filteredSiswa = useMemo(
    () =>
      MOCK_SISWA.filter(
        (s) =>
          s.nama.toLowerCase().includes(search.toLowerCase()) ||
          s.kelas.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const totalSiswa = MOCK_SISWA.length;
  const sudahIsi = MOCK_SISWA.filter((s) => s.sudahIsiHariIni).length;
  const belumIsi = totalSiswa - sudahIsi;

  async function toggleHabitSetting(key: string) {
    const newValue = !habitSettings[key];
    setSavingHabit(key);
    setHabitSettings((prev) => ({ ...prev, [key]: newValue }));

    try {
      await fetch("/api/admin/habit-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitKey: key, requiresPhoto: newValue }),
      });
    } finally {
      setSavingHabit(null);
    }
  }

  return (
    <main className="min-h-screen bg-background px-container-margin md:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-institution-blue mb-1">
          Dashboard Guru
        </h1>
        <p className="text-on-surface-variant text-body-md font-body-md mb-6">
          Pantau kepatuhan 7 kebiasaan siswa bimbingan Anda hari ini.
        </p>

        {/* Stat ringkas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-white rounded-xl shadow-sm p-4 border border-outline-variant text-center">
            <p className="text-headline-lg-mobile font-headline-lg-mobile text-institution-blue">{totalSiswa}</p>
            <p className="text-label-sm text-on-surface-variant">Total Siswa</p>
          </div>
          <div className="bg-surface-white rounded-xl shadow-sm p-4 border border-outline-variant text-center">
            <p className="text-headline-lg-mobile font-headline-lg-mobile text-success-green">{sudahIsi}</p>
            <p className="text-label-sm text-on-surface-variant">Sudah Isi</p>
          </div>
          <div className="bg-surface-white rounded-xl shadow-sm p-4 border border-outline-variant text-center">
            <p className="text-headline-lg-mobile font-headline-lg-mobile text-error">{belumIsi}</p>
            <p className="text-label-sm text-on-surface-variant">Belum Isi</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Daftar siswa — kolom kelas tetap tampil karena lintas kelas */}
          <div className="md:col-span-2 bg-surface-white rounded-xl shadow-sm p-card-padding border border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-title-md text-title-md text-institution-blue">Siswa Bimbingan</h2>
              <input
                type="text"
                placeholder="Cari nama/kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-outline-variant rounded-lg px-3 py-2 text-body-md font-body-md focus:ring-institution-blue focus:border-institution-blue"
              />
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="text-label-sm text-on-surface-variant border-b border-outline-variant">
                  <th className="py-2 font-label-sm">Nama</th>
                  <th className="py-2 font-label-sm">Kelas</th>
                  <th className="py-2 font-label-sm">Status Hari Ini</th>
                </tr>
              </thead>
              <tbody>
                {filteredSiswa.map((s) => (
                  <tr key={s.id} className="border-b border-outline-variant/50">
                    <td className="py-3 font-body-md text-body-md text-on-surface">{s.nama}</td>
                    <td className="py-3">
                      <span className="bg-surface-container-low text-on-surface-variant text-label-sm px-2 py-1 rounded-full">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={[
                          "text-label-sm font-semibold px-2 py-1 rounded-full",
                          s.sudahIsiHariIni
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-error-container text-on-error-container",
                        ].join(" ")}
                      >
                        {s.sudahIsiHariIni ? "Sudah Isi" : "Belum Isi"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSiswa.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-on-surface-variant text-body-md">
                      Tidak ada siswa yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Panel pengaturan wajib-foto */}
          <div className="bg-surface-white rounded-xl shadow-sm p-card-padding border border-outline-variant">
            <h2 className="font-title-md text-title-md text-institution-blue mb-1">Wajib Bukti Foto</h2>
            <p className="text-label-sm text-on-surface-variant mb-4">
              Berlaku untuk semua siswa bimbingan Anda.
            </p>

            <div className="space-y-3">
              {Object.entries(HABIT_LABELS).map(([key, label]) => (
                <div key={key}>
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-body-md text-on-surface">{label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={habitSettings[key]}
                        onChange={() => toggleHabitSetting(key)}
                        disabled={savingHabit === key}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success-green" />
                    </label>
                  </div>
                  {habitSettings[key] && PRIVATE_HABITS.has(key) && (
                    <p className="text-label-sm text-streak-orange mt-1 flex items-start gap-1">
                      <span className="material-symbols-outlined text-[14px] mt-0.5">warning</span>
                      Kebiasaan ini berkaitan dengan ruang privat siswa — pertimbangkan bukti
                      alternatif (mis. foto jam alarm) daripada foto langsung siswa.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
