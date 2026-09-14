import bcrypt from "bcryptjs";
/** Kept separate from lib/auth so seeding can run outside the Next.js runtime. */
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
