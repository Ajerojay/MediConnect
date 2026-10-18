import { toggleUserStatus } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export function UserTable({
  users,
}: {
  users: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date | string;
  }[];
}) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {["Name", "Email", "Role", "Status", "Action"].map((x) => (
              <th key={x} className="p-4">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="p-4 font-bold">{u.fullName}</td>
              <td className="p-4">{u.email}</td>
              <td className="p-4">{u.role}</td>
              <td className="p-4">
                <Badge status={u.isActive ? "COMPLETED" : "CANCELLED"}>
                  {u.isActive ? "Active" : "Disabled"}
                </Badge>
              </td>
              <td className="p-4">
                <form action={toggleUserStatus}>
                  <input type="hidden" name="id" value={u.id} />
                  <Button variant={u.isActive ? "danger" : "outline"}>
                    {u.isActive ? "Disable" : "Enable"}
                  </Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
