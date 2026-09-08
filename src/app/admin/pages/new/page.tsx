import { PageForm } from "../page-form";
import { createPage } from "../actions";
import { getEditorContext } from "@/lib/admin/editor-context";

export default async function NewPagePage() {
  const { role, mediaOptions } = await getEditorContext();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New page</h1>
      <PageForm
        action={createPage}
        submitLabel="Create page"
        role={role}
        mediaOptions={mediaOptions}
      />
    </div>
  );
}
