"use client";

import { useMemo, useRef, useState } from "react";

/**
 * Form Isi Jurnal Harian — Jurnal 7 KAIH
 * Dikonversi dari code.html (export Stitch, frame "Isi Jurnal").
 *
 * Perbedaan dari versi statis Stitch:
 * - `requiresPhoto` per kebiasaan sekarang DATA, bukan hardcode di markup —
 *   datanya berasal dari `habit_settings` (diatur guru wali). Lihat
 *   stitch-prompt-jurnal7kaih.md untuk skema lengkapnya.
 * - Validasi wajib-foto dijalankan di klien untuk UX (tombol disabled +
 *   pesan), TAPI server (API route) tetap WAJIB validasi ulang sebelum
 *   simpan — jangan percaya status dari klien saja.
 */

type Habit = {
  key: string;
  label: string;
  icon: string; // nama Material Symbols
  requiresPhoto: boolean;
  done: boolean;
  note?: string;
  photoPreviewUrl?: string | null;
};

const initialHabits: Habit[] = [
  { key: "bangun_pagi", label: "Bangun Pagi", icon: "wb_sunny", requiresPhoto: true, done: true, photoPreviewUrl: null },
  { key: "beribadah", label: "Beribadah", icon: "auto_awesome", requiresPhoto: false, done: false },
  { key: "berolahraga", label: "Berolahraga", icon: "fitness_center", requiresPhoto: false, done: true, note: "Lari pagi 15 menit" },
  { key: "makan_sehat", label: "Makan Sehat", icon: "restaurant", requiresPhoto: false, done: false },
  { key: "gemar_belajar", label: "Gemar Belajar", icon: "menu_book", requiresPhoto: false, done: true },
  { key: "bermasyarakat", label: "Bermasyarakat", icon: "groups", requiresPhoto: false, done: false },
  { key: "tidur_cepat", label: "Tidur Cepat", icon: "bedtime", requiresPhoto: true, done: false, photoPreviewUrl: null },
];

export default function JournalEntryForm({
  tanggal = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  streakHari = 12,
}: {
  tanggal?: string;
  streakHari?: number;
}) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const missingPhotoHabits = useMemo(
    () => habits.filter((h) => h.requiresPhoto && !h.photoPreviewUrl),
    [habits]
  );
  const canSubmit = missingPhotoHabits.length === 0 && !isSubmitting;

  function toggleHabit(key: string) {
    setHabits((prev) =>
      prev.map((h) => (h.key === key ? { ...h, done: !h.done } : h))
    );
  }

  function updateNote(key: string, note: string) {
    setHabits((prev) => prev.map((h) => (h.key === key ? { ...h, note } : h)));
  }

  function handlePhotoSelect(key: string, file: File | null) {
    if (!file) return;
    // Kompres dulu sebelum upload sungguhan ke server (lihat catatan
    // browser-image-compression di stitch-prompt-jurnal7kaih.md).
    const previewUrl = URL.createObjectURL(file);
    setHabits((prev) =>
      prev.map((h) => (h.key === key ? { ...h, photoPreviewUrl: previewUrl } : h))
    );
  }

  function removePhoto(key: string) {
    setHabits((prev) =>
      prev.map((h) => (h.key === key ? { ...h, photoPreviewUrl: null } : h))
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      // POST ke API route (mis. /api/jurnal). Foto sebenarnya diupload
      // ke Google Drive lewat endpoint terpisah, lalu drive_file_id
      // dikirim di payload ini — bukan file mentahnya.
      await fetch("/api/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, habits }),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background pt-8 px-container-margin md:px-8 pb-32">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-institution-blue">
              Jurnal Harian
            </h1>
            <p className="text-on-surface-variant font-body-md text-body-md">{tanggal}</p>
          </div>
          <div className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg w-fit">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              stars
            </span>
            <span className="font-label-md text-label-md">Streak: {streakHari} Hari</span>
          </div>
        </div>

        {/* Habit List */}
        <div className="space-y-6">
          {habits.map((habit) => {
            const missingRequired = habit.requiresPhoto && !habit.photoPreviewUrl;
            return (
              <div
                key={habit.key}
                className={[
                  "bg-surface-white rounded-xl shadow-sm p-card-padding transition-colors",
                  missingRequired
                    ? "border-2 border-error photo-required-glow"
                    : "border border-outline-variant",
                  !habit.done && !missingRequired ? "opacity-70" : "",
                  habit.done && !missingRequired ? "habit-card-active" : "",
                ].join(" ")}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        missingRequired
                          ? "bg-error-container text-error"
                          : habit.done
                          ? "bg-primary-fixed text-institution-blue"
                          : "bg-surface-container-high text-on-surface-variant",
                      ].join(" ")}
                    >
                      <span className="material-symbols-outlined">{habit.icon}</span>
                    </div>
                    <div>
                      <h3
                        className={[
                          "font-title-md text-title-md",
                          habit.done || missingRequired ? "text-institution-blue" : "text-on-surface-variant",
                        ].join(" ")}
                      >
                        {habit.label}
                      </h3>
                      {habit.requiresPhoto && (
                        <div className="flex items-center gap-1">
                          {missingRequired && (
                            <span className="material-symbols-outlined text-error text-[16px]">error</span>
                          )}
                          <p
                            className={[
                              "text-label-sm font-semibold uppercase",
                              missingRequired ? "text-error" : "text-success-green",
                            ].join(" ")}
                          >
                            Wajib Upload Foto *
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={habit.done}
                      onChange={() => toggleHabit(habit.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-green" />
                  </label>
                </div>

                {/* Catatan opsional */}
                {habit.note !== undefined && !habit.requiresPhoto && (
                  <div className="mt-2">
                    <label className="text-label-sm text-on-surface-variant mb-1 block">
                      Catatan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={habit.note}
                      onChange={(e) => updateNote(habit.key, e.target.value)}
                      className="w-full bg-surface-container-low border-outline-variant rounded-lg font-body-md text-body-md focus:ring-institution-blue focus:border-institution-blue px-3 py-2"
                    />
                  </div>
                )}

                {/* Area upload — hanya tampil untuk kebiasaan wajib foto */}
                {habit.requiresPhoto && (
                  <div className="mt-4">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[habit.key] = el;
                      }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(habit.key, e.target.files?.[0] ?? null)}
                    />

                    {habit.photoPreviewUrl ? (
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-outline">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={habit.photoPreviewUrl}
                            alt={`Bukti ${habit.label}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(habit.key)}
                            className="absolute -top-2 -right-2 bg-error text-surface-white rounded-full p-1 shadow-md"
                            aria-label={`Hapus foto ${habit.label}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[habit.key]?.click()}
                          className="flex-1 border-2 border-dashed border-outline-variant rounded-lg p-4 flex flex-col items-center justify-center bg-surface-bright hover:border-institution-blue transition-all"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant mb-1">
                            add_a_photo
                          </span>
                          <span className="text-label-md text-on-surface-variant">Unggah Bukti</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[habit.key]?.click()}
                        className="w-full flex flex-col items-center justify-center border-2 border-dashed border-error-container bg-error-container/10 rounded-lg p-6 hover:bg-error-container/20 transition-all"
                      >
                        <span className="material-symbols-outlined text-error mb-2 text-[32px]">
                          photo_camera
                        </span>
                        <p className="text-label-md text-error font-semibold">
                          Unggah Bukti {habit.label}
                        </p>
                        <p className="text-label-sm text-on-surface-variant mt-1">
                          Status: Foto Belum Tersedia
                        </p>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Validasi & Submit */}
        <div className="mt-12 space-y-4">
          {missingPhotoHabits.length > 0 && (
            <div className="bg-on-surface text-surface-white p-4 rounded-lg flex items-start gap-3 shadow-lg max-w-sm mx-auto">
              <span className="material-symbols-outlined text-error">info</span>
              <p className="text-label-md">
                Mohon unggah foto wajib untuk kebiasaan:{" "}
                <span className="font-bold">
                  {missingPhotoHabits.map((h) => h.label).join(", ")}
                </span>
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={[
              "w-full py-4 rounded-xl font-title-md text-title-md font-bold flex items-center justify-center gap-2 transition-colors",
              canSubmit
                ? "bg-institution-blue text-on-primary cursor-pointer"
                : "bg-outline text-surface-container-high cursor-not-allowed",
            ].join(" ")}
          >
            <span className="material-symbols-outlined">
              {canSubmit ? "lock_open" : "lock"}
            </span>
            {isSubmitting ? "Menyimpan…" : "Simpan Jurnal Hari Ini"}
          </button>
        </div>
      </div>
    </main>
  );
}
