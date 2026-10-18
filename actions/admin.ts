"use server";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import type { User } from "@/lib/types";
export async function toggleUserStatus(form: FormData) {
  const actor = await requireRole("ADMIN");
  const id = String(form.get("id"));
  if (id === actor.id) return;
  const user = await api<User>(`/users/${id}`);
  await api(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive: !user.isActive }),
  });
  revalidatePath("/admin/users");
}
