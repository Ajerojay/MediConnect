"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { loginSchema, registerSchema } from "@/lib/validation";
import type { User } from "@/lib/types";
export type ActionState = { error?: string; success?: string };
export async function login(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let user: User;
  try {
    const r = await api<{ accessToken: string; user: User }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(parsed.data) },
      false,
    );
    user = r.user;
    (await cookies()).set("mediconnect_session", r.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to sign in." };
  }
  redirect(`/${user.role.toLowerCase()}/dashboard`);
}
export async function register(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await api(
      "/auth/register",
      { method: "POST", body: JSON.stringify(parsed.data) },
      false,
    );
    return { success: "Account created. You can now sign in." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to register." };
  }
}
export async function logout() {
  (await cookies()).delete("mediconnect_session");
  redirect("/login");
}
