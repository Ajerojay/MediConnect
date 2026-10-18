import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { PageHeading } from "@/components/page-heading";
import { UserTable } from "@/components/user-table";
export default async function Users() {
  await requireRole("ADMIN");
  const users = await api<User[]>("/users");
  return (
    <>
      <PageHeading
        title="Users"
        description="Manage access for every MediConnect account."
      />
      <UserTable users={users} />
    </>
  );
}
