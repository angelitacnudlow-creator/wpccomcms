import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminFormsPage() {
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("form_submissions")
    .select("id, form_key, data, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Form submissions</h1>
      {submissions?.map((sub) => {
        const data = sub.data as Record<string, string>;
        return (
          <Card key={sub.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{data.name ?? data.email ?? "Submission"}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{sub.form_key}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(sub.created_at).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {Object.entries(data).map(([key, value]) => (
                <p key={key}>
                  <span className="font-medium text-foreground">{key}:</span> {value}
                </p>
              ))}
            </CardContent>
          </Card>
        );
      })}
      {submissions?.length === 0 && (
        <p className="text-muted-foreground">No submissions yet.</p>
      )}
    </div>
  );
}
