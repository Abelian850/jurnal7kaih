import Link from "next/link";

/**
 * Dashboard Siswa — Jurnal 7 KAIH
 * Dikonversi dari screenshot Stitch (frame "Dashboard Siswa").
 *
 * Versi ini masih pakai data contoh (mock). Untuk produksi, ganti jadi
 * server component yang fetch dari D1: data siswa, status 7 hari terakhir,
 * dan status 7 kebiasaan hari ini (termasuk requires_photo dari habit_settings
 * milik wali_guru_id siswa yang login).
 */

const HABITS = [
  { no: 1, label: "Jadilah Proaktif", done: true },
  { no: 2, label: "Mulai dengan Akhir di Pikiran", done: true },
  { no: 3, label: "Dahulukan yang Utama", done: false },
  { no: 4, label: "Berpikir Menang-Menang", done: false },
  { no: 5, label: "Berusaha Mengerti Dahulu", done: false },
  { no: 6, label: "Wujudkan Sinergi", done: false },
  { no: 7, label: "Asah Gergaji", done: false },
];

const WEEK = [
  { hari: "SEN", tanggal: null, status: "done" },
  { hari: "SEL", tanggal: null, status: "done" },
  { hari: "RAB", tanggal: null, status: "done" },
  { hari: "KAM", tanggal: null, status: "done" },
  { hari: "JUM", tanggal: null, status: "done" },
  { hari: "SAB", tanggal: 6, status: "pending" },
  { hari: "MIN", tanggal: 7, status: "pending" },
];

export default function DashboardSiswaPage() {
  // Contoh data — ganti dengan session siswa yang login
  const nama = "Ahmad Fauzi";
  const kelas = "9A";
  const namaWali = "Ibu Siti Aminah";
  const streak = 5;

  return (
    <main className="min-h-screen bg-background px-container-margin md:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-institution-blue">
              Halo, {nama}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-surface-container-low text-on-surface-variant text-label-md font-label-md px-3 py-1 rounded-full">
                Kelas {kelas}
              </span>
              <span className="text-on-surface-variant text-label-md font-label-md">
                • Guru Wali: {namaWali}
              </span>
            </div>
          </div>
          <Link
            href="/journal"
            className="bg-institution-blue text-on-primary px-5 py-3 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-2 w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">edit_document</span>
            Isi Jurnal Hari Ini
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Daily Streak */}
          <div className="bg-surface-white rounded-xl shadow-sm p-card-padding border border-outline-variant">
            <h2 className="font-title-md text-title-md text-institution-blue mb-1">Daily Streak</h2>
            <p className="text-on-surface-variant text-body-md font-body-md mb-3">
              Hebat! Kamu sudah menjaga kedisiplinan selama beberapa hari ini.
            </p>
            <p className="text-streak-orange text-headline-lg-mobile font-headline-lg-mobile font-bold">
              {streak} Hari berturut-turut! 🔥
            </p>
          </div>

          {/* Progress Mingguan */}
          <div className="bg-surface-white rounded-xl shadow-sm p-card-padding border border-outline-variant">
            <h2 className="font-title-md text-title-md text-institution-blue mb-3">Progress Mingguan</h2>
            <div className="grid grid-cols-7 gap-2 text-center">
              {WEEK.map((d) => (
                <div key={d.hari} className="flex flex-col items-center gap-1">
                  <span className="text-label-sm text-on-surface-variant font-label-sm">{d.hari}</span>
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-semibold",
                      d.status === "done"
                        ? "bg-secondary-container text-on-secondary-container"
                        : "border-2 border-dashed border-outline-variant text-on-surface-variant",
                    ].join(" ")}
                  >
                    {d.status === "done" ? "✓" : d.tanggal}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-label-sm text-on-surface-variant mt-3">
              Selesaikan jurnal akhir pekanmu untuk mempertahankan streak minggu ini!
            </p>
          </div>
        </div>

        {/* Status 7 Kebiasaan */}
        <div className="bg-surface-white rounded-xl shadow-sm p-card-padding border border-outline-variant">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-title-md text-title-md text-institution-blue">Status 7 Kebiasaan Hari Ini</h2>
            <div className="flex items-center gap-3 text-label-sm font-label-sm">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success-green inline-block" /> Selesai
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-outline-variant inline-block" /> Belum
              </span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {HABITS.map((h) => (
              <div
                key={h.no}
                className={[
                  "flex items-center justify-between rounded-lg px-4 py-3 border",
                  h.done
                    ? "bg-secondary-container/40 border-secondary-container"
                    : "bg-surface-container-low border-outline-variant",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-bold text-white",
                      h.done ? "bg-success-green" : "bg-outline",
                    ].join(" ")}
                  >
                    {h.no}
                  </span>
                  <span
                    className={[
                      "font-label-md text-label-md font-semibold",
                      h.done ? "text-success-green" : "text-on-surface-variant",
                    ].join(" ")}
                  >
                    {h.label}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[20px]">
                  {h.done ? "check_circle" : "radio_button_unchecked"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
