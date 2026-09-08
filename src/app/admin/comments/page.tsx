import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ModerationActions } from "./moderation-actions";

export default async function AdminCommentsPage() {
  const supabase = await createClient();
  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, status, created_at, profiles(display_name), posts(title, slug)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Comments</h1>
      <div className="space-y-4">
        {comments?.map((comment) => {
          const author = comment.profiles as unknown as { display_name: string } | null;
          const post = comment.posts as unknown as { title: string; slug: string } | null;
          return (
            <div key={comment.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{author?.display_name}</span> on{" "}
                  <span className="font-medium text-foreground">{post?.title}</span> ·{" "}
                  {new Date(comment.created_at).toLocaleDateString()}
                </div>
                <Badge
                  variant={
                    comment.status === "approved"
                      ? "default"
                      : comment.status === "spam"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {comment.status}
                </Badge>
              </div>
              <p className="mb-3 text-sm">{comment.body}</p>
              <ModerationActions commentId={comment.id} status={comment.status} />
            </div>
          );
        })}
        {comments?.length === 0 && (
          <p className="text-muted-foreground">No comments yet.</p>
        )}
      </div>
    </div>
  );
}
