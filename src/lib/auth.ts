import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { get } from "./db";
import type { ModuleKey, Perm, Role } from "./permissions";

/** Server-only session layer. The pure role matrix lives in ./permissions. */
export { ROLES, ROLE_LABELS, PERMISSIONS, can } from "./permissions";
export type { Role, ModuleKey, Perm } from "./permissions";
import { can } from "./permissions";

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export const SESSION_COOKIE = "cm_session";
const SECRET = new TextEncoder().encode(
  process.env.CRISTALU_JWT_SECRET || "cristalu-maroc-dev-secret-change-me",
);

export type SessionUser = {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  jobTitle?: string | null;
  color?: string;
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  try {
    return await bcrypt.compare(pw, hash);
  } catch {
    return false;
  }
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .setIssuer("cristalumaroc")
    .sign(SECRET);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: "cristalumaroc" });
    const p = payload as unknown as SessionUser;
    if (!p?.id || !p?.role) return null;
    // Re-validate against DB so a deactivated user loses access immediately.
    const row = get<{ active: number; full_name: string; role: string; job_title: string; color: string }>(
      `SELECT active, full_name, role, job_title, color FROM users WHERE id = ?`,
      [p.id],
    );
    if (!row || !row.active) return null;
    return {
      id: p.id,
      email: p.email,
      fullName: row.full_name,
      role: row.role as Role,
      jobTitle: row.job_title,
      color: row.color,
    };
  } catch {
    return null;
  }
}

/** Guard for API routes / server actions. Returns the session or throws a 401-ish object. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("unauthenticated");
  return user;
}

/**
 * Guard for pages and server actions. A role without permission is redirected to
 * the no-access screen rather than throwing — an unhandled AuthError would
 * surface as a 500 to the user.
 */
export async function requirePerm(module: ModuleKey, perm: Perm = "view"): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, module, perm)) {
    redirect(`/app/no-access?module=${encodeURIComponent(module)}`);
  }
  return user;
}

export class AuthError extends Error {
  constructor(public kind: "unauthenticated" | "forbidden") {
    super(kind === "unauthenticated" ? "Authentification requise" : "Accès refusé");
  }
}
