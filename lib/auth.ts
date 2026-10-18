import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { api, ApiError } from "./api";
import type { Role, User } from "./types";
export const getCurrentUser = cache(async () => {
  if (!(await cookies()).get("mediconnect_session")) return null;
  try {
    return await api<User>("/auth/me");
  } catch (e) {
    if (e instanceof ApiError && [401, 403].includes(e.status)) return null;
    throw e;
  }
});
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user?.isActive) redirect("/login");
  return user;
}
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role))
    redirect(`/${user.role.toLowerCase()}/dashboard`);
  return user;
}
