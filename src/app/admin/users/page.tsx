import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleSelect } from "./role-select";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: viewerProfile }, { data: users }] = await Promise.all([
    user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("profiles").select("id, display_name, role, created_at").order("created_at"),
  ]);

  const canEdit = viewerProfile?.role === "admin";

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      {!canEdit && (
        <p className="text-sm text-muted-foreground">
          Only admins can change roles — you can view but not edit.
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.display_name}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {canEdit ? (
                  <RoleSelect userId={u.id} role={u.role} />
                ) : (
                  <Badge variant="secondary">{u.role}</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
