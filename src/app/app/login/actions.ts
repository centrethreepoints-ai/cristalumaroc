"use server";

import { redirect } from "next/navigation";
import { audit, get, run } from "@/lib/db";
import { createSession, destroySession, verifyPassword, type Role } from "@/lib/auth";

export type LoginResult = { ok: boolean; error?: "credentials" | "inactive" };

export async function login(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { ok: false, error: "credentials" };

  const user = get<{
    id: number; email: string; password_hash: string; full_name: string;
    role: Role; job_title: string; color: string; active: number;
  }>(`SELECT * FROM users WHERE lower(email) = ?`, [email]);

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    audit({ action: "LOGIN_FAILED", objectType: "user", objectLabel: email, newValue: { email } });
    return { ok: false, error: "credentials" };
  }
  if (!user.active) return { ok: false, error: "inactive" };

  run(`UPDATE users SET last_login = datetime('now') WHERE id = ?`, [user.id]);
  await createSession({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    jobTitle: user.job_title,
    color: user.color,
  });
  audit({
    userId: user.id,
    userName: user.full_name,
    action: "LOGIN",
    objectType: "user",
    objectId: user.id,
    objectLabel: user.email,
  });

  redirect("/app/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/app/login");
}
