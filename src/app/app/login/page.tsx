import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { LoginPage } from "./LoginPage";

export const metadata = { title: "Espace usine" };

export default async function LoginRoute() {
  const user = await getSessionUser();
  if (user) redirect("/app/dashboard");

  const demoUsers = all<{ email: string; full_name: string; role: string; job_title: string; color: string }>(
    `SELECT email, full_name, role, job_title, color FROM users WHERE active = 1 ORDER BY
      CASE role WHEN 'admin' THEN 1 WHEN 'direction' THEN 2 WHEN 'commercial' THEN 3
                WHEN 'production' THEN 4 WHEN 'stock' THEN 5 WHEN 'accountant' THEN 6 ELSE 7 END, id`,
  );

  return <LoginPage demoUsers={demoUsers} />;
}
