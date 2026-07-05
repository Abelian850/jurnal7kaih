"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/**
 * Halaman Login — Jurnal 7 KAIH
 * SMP Negeri 30 Semarang
 *
 * Login pakai NISN sebagai username. Password awal = NISN siswa sendiri,
 * lalu dipaksa ganti password lewat flag must_change_password dari server
 * (lihat catatan di stitch-prompt-jurnal7kaih.md, bagian "Catatan setelah generate").
 */

export default function LoginPage() {
  const router = useRouter();
  const [nisn, setNisn] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (nisn.length !== 10 || !/^\d+$/.test(nisn)) {
      setError("NISN harus terdiri dari 10 digit angka.");
      return;
    }
    if (password.length === 0) {
      setError("Password tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Sambungkan ke signIn("credentials", { nisn, password }) dari Auth.js di sini.
      // Server WAJIB mengecek flag must_change_password dan redirect ke
      // /ganti-password kalau true, sebelum masuk ke dashboard.
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nisn, password }),
      });

      if (!res.ok) {
        setError("NISN atau password salah. Coba lagi.");
        setIsSubmitting(false);
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.mustChangePassword) {
        router.push("/ganti-password");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Tidak bisa terhubung ke server. Coba lagi.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-container-margin py-12">
      <div className="w-full max-w-sm bg-surface-white rounded-xl shadow-sm p-card-padding">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 relative mb-3">
            <Image
              src="/images/logo-smpn30.png"
              alt="Logo SMP Negeri 30 Semarang"
              fill
              sizes="80px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-title-md text-title-md text-institution-blue font-semibold">
            Jurnal 7 KAIH
          </h1>
          <p className="font-label-md text-label-md text-on-surface-variant">
            SMP Negeri 30 Semarang
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-surface-container-low border-l-4 border-institution-blue rounded-lg p-4 mb-6 flex gap-3">
          <span className="material-symbols-outlined text-institution-blue text-[20px] shrink-0">
            info
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Gunakan NISN sebagai username. Password awal Anda adalah NISN
            Anda sendiri — segera ganti setelah login pertama.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NISN */}
          <div>
            <label
              htmlFor="nisn"
              className="font-label-md text-label-md text-on-surface block mb-1"
            >
              NISN
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                badge
              </span>
              <input
                id="nisn"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="Masukkan 10 digit NISN"
                value={nisn}
                onChange={(e) => setNisn(e.target.value.replace(/\D/g, ""))}
                className="w-full pl-11 pr-4 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-institution-blue focus:border-institution-blue"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="font-label-md text-label-md text-on-surface block mb-1"
            >
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-institution-blue focus:border-institution-blue"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-error text-label-md font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-institution-blue text-on-primary rounded-lg font-title-md text-title-md font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
          >
            {isSubmitting ? "Memproses…" : "Masuk"}
            {!isSubmitting && (
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            )}
          </button>
        </form>

        <hr className="my-6 border-outline-variant" />

        <p className="text-center font-label-md text-label-md">
          <a href="#" className="text-institution-blue underline">
            Lupa password? Hubungi guru wali atau admin
          </a>
        </p>
      </div>

      <p className="mt-8 font-label-sm text-label-sm text-on-surface-variant">
        © {new Date().getFullYear()} Jurnal 7 KAIH — Digital Habit Tracker
      </p>
    </main>
  );
}
