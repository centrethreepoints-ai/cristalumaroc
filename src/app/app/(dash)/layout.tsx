import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Sidebar } from "@/components/dash/Sidebar";
import { Topbar } from "@/components/dash/Topbar";
import { all, get } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/app/login");

  const notifications = all(
    `SELECT id, type, level, title, body, link, read, created_at FROM notifications ORDER BY created_at DESC LIMIT 12`,
  );
  const unread = get<{ c: number }>(`SELECT COUNT(*) AS c FROM notifications WHERE read = 0`)?.c ?? 0;

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar role={user.role} />

      <div className="flex min-w-0 flex-1 flex-col lg:ps-[248px]">
        <Topbar user={user} notifications={notifications} unread={unread} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

