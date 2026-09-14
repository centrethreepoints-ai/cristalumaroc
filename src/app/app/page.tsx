import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function AppIndex() {
  const user = await getSessionUser();
  redirect(user ? "/app/dashboard" : "/app/login");
}
