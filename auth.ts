import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getRequestContext } from "@cloudflare/next-on-pages";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "./lib/db";
import { siswa } from "./lib/schema";

/**
 * Auth.js v5 — login pakai NISN sebagai username.
 * Password awal = NISN (di-hash, bukan plaintext) — lihat must_change_password
 * untuk memaksa ganti password di login pertama.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        nisn: { label: "NISN", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const nisn = credentials?.nisn as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!nisn || !password) return null;

        const { env } = getRequestContext();
        const db = getDb(env.DB as D1Database);

        const user = await db
          .select()
          .from(siswa)
          .where(eq(siswa.nisn, nisn))
          .get();

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.nama,
          nisn: user.nisn,
          kelas: user.kelas,
          waliGuruId: user.waliGuruId,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword;
        token.waliGuruId = (user as { waliGuruId?: string }).waliGuruId;
      }
      return token;
    },
    async session({ session, token }) {
      (session as typeof session & { mustChangePassword?: boolean }).mustChangePassword =
        token.mustChangePassword as boolean | undefined;
      (session as typeof session & { waliGuruId?: string }).waliGuruId =
        token.waliGuruId as string | undefined;
      return session;
    },
  },
});
