const STATUS_ORDER = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"] as const;

const STATUS_LABEL: Record<(typeof STATUS_ORDER)[number], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Status dots use the dataviz skill's fixed, never-themed status palette
// (good/warning/serious/critical) plus one neutral for "pending" — never a
// categorical hue, since these are states, not identity.
const STATUS_COLOR: Record<(typeof STATUS_ORDER)[number], string> = {
  pending: "#898781",
  confirmed: "#2a78d6",
  out_for_delivery: "#fab219",
  delivered: "#0ca30c",
  cancelled: "#d03b3b",
};

export function OrderStatusList({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-3">
      {STATUS_ORDER.map((status) => {
        const count = counts[status] ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={status}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[status] }}
                  aria-hidden
                />
                {STATUS_LABEL[status]}
              </span>
              <span className="tabular-nums text-muted-foreground">{count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: STATUS_COLOR[status] }}
              />
            </div>
          </div>
        );
      })}
      {total === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
    </div>
  );
}
