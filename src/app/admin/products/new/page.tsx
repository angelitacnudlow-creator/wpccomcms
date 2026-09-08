import { ProductForm } from "../product-form";
import { createProduct } from "../actions";
import { getEditorContext } from "@/lib/admin/editor-context";

export default async function NewProductPage() {
  const { role, mediaOptions } = await getEditorContext();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm
        action={createProduct}
        submitLabel="Create product"
        role={role}
        mediaOptions={mediaOptions}
      />
    </div>
  );
}
