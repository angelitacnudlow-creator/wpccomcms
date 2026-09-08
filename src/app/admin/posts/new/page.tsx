import { PostForm } from "../post-form";
import { createPost } from "../actions";
import { getEditorContext } from "@/lib/admin/editor-context";

export default async function NewPostPage() {
  const { role, mediaOptions, termOptions } = await getEditorContext();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New post</h1>
      <PostForm
        action={createPost}
        submitLabel="Create post"
        role={role}
        mediaOptions={mediaOptions}
        termOptions={termOptions}
      />
    </div>
  );
}
