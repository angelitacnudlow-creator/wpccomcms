import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeletePageButton } from "./delete-button";

export default async function AdminPagesPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, status, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pages</h1>
        <Link href="/admin/pages/new" className={buttonVariants()}>
          New page
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages?.map((page) => (
            <TableRow key={page.id}>
              <TableCell className="font-medium">{page.title}</TableCell>
              <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
              <TableCell>
                <Badge variant={page.status === "published" ? "default" : "secondary"}>
                  {page.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(page.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="flex justify-end gap-2 text-right">
                <Link
                  href={`/admin/pages/${page.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Edit
                </Link>
                <DeletePageButton pageId={page.id} />
              </TableCell>
            </TableRow>
          ))}
          {pages?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No pages yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
