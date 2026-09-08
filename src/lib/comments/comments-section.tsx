import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "./comment-form";
import { ReplyToggle } from "./reply-toggle";

type CommentRow = {
  id: string;
  body: string;
  status: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  profiles: { display_name: string } | null;
};

export async function CommentsSection({
  postId,
  postSlug,
}: {
  postId: string;
  postSlug: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, status, created_at, parent_id, user_id, profiles(display_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const rows = (comments ?? []) as unknown as CommentRow[];
  const topLevel = rows.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => rows.filter((c) => c.parent_id === id);

  return (
    <section className="mt-12 space-y-6 border-t pt-8">
      <h2 className="text-xl font-semibold">Comments</h2>

      <div className="space-y-6">
        {topLevel.map((comment) => (
          <div key={comment.id} className="space-y-3">
            <CommentView comment={comment} currentUserId={user?.id} />
            <div className="ml-6 space-y-3">
              {repliesOf(comment.id).map((reply) => (
                <CommentView key={reply.id} comment={reply} currentUserId={user?.id} />
              ))}
              <ReplyToggle
                postId={postId}
                postSlug={postSlug}
                parentId={comment.id}
                isLoggedIn={Boolean(user)}
              />
            </div>
          </div>
        ))}
        {topLevel.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
      </div>

      <div className="border-t pt-6">
        <CommentForm postId={postId} postSlug={postSlug} parentId={null} isLoggedIn={Boolean(user)} />
      </div>
    </section>
  );
}

function CommentView({
  comment,
  currentUserId,
}: {
  comment: CommentRow;
  currentUserId: string | undefined;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{comment.profiles?.display_name ?? "Someone"}</span>
        <span className="text-muted-foreground">
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
        {comment.status === "pending" && comment.user_id === currentUserId && (
          <span className="text-xs text-muted-foreground">(awaiting approval)</span>
        )}
      </div>
      <p className="mt-1 text-sm">{comment.body}</p>
    </div>
  );
}
