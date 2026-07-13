import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "./session";

/** Resolve the logged-in user from the session cookie, or null. */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySession(token);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
}
