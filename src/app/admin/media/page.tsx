import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./upload-form";
import { DeleteMediaButton } from "./delete-button";

export default async function AdminMediaPage() {
  const supabase = await createClient();
  const { data: media } = await supabase
    .from("media")
    .select("id, url, alt_text, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Media</h1>
      <UploadForm />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {media?.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="relative aspect-square overflow-hidden rounded-md border bg-muted">
              <Image
                src={item.url}
                alt={item.alt_text ?? ""}
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>
            <DeleteMediaButton mediaId={item.id} />
          </div>
        ))}
        {media?.length === 0 && (
          <p className="col-span-full text-muted-foreground">No media uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
