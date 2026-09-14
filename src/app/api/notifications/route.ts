import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { run } from "@/lib/db";

/** Mark every notification as read. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  run(`UPDATE notifications SET read = 1`);
  return NextResponse.json({ ok: true });
}
