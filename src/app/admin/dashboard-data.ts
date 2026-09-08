import { createClient } from "@/lib/supabase/server";

const DAY_MS = 86_400_000;

export type DailyRevenue = { date: string; bdt: number };

export async function getDashboardData() {
  const supabase = await createClient();
  const now = new Date();
  const periodStart = new Date(now.getTime() - 30 * DAY_MS);
  const prevPeriodStart = new Date(now.getTime() - 60 * DAY_MS);

  const [
    { data: recentOrders },
    { data: prevOrders },
    { count: publishedPosts },
    { count: pendingComments },
    { data: statusCounts },
    { data: orderItems },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total_bdt, created_at")
      .gte("created_at", periodStart.toISOString()),
    supabase
      .from("orders")
      .select("id, status, total_bdt")
      .gte("created_at", prevPeriodStart.toISOString())
      .lt("created_at", periodStart.toISOString()),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("orders").select("status"),
    supabase
      .from("order_items")
      .select("quantity, unit_price_bdt, product_variants(products(name))"),
  ]);

  const revenueOf = (orders: { status: string; total_bdt: number }[] | null) =>
    (orders ?? [])
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total_bdt, 0);

  const currentRevenue = revenueOf(recentOrders);
  const previousRevenue = revenueOf(prevOrders);
  const currentOrderCount = recentOrders?.length ?? 0;
  const previousOrderCount = prevOrders?.length ?? 0;

  // Daily revenue series for the last 30 days, zero-filled so the line has
  // one point per day even on days with no orders.
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const order of recentOrders ?? []) {
    if (order.status === "cancelled") continue;
    const key = order.created_at.slice(0, 10);
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + order.total_bdt);
  }
  const dailyRevenue: DailyRevenue[] = Array.from(dailyMap, ([date, bdt]) => ({ date, bdt }));

  const statusBreakdown = (statusCounts ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const productTotals = new Map<string, { name: string; units: number; revenueBdt: number }>();
  for (const item of orderItems ?? []) {
    const name =
      (item.product_variants as unknown as { products: { name: string } | null } | null)
        ?.products?.name ?? "Unknown product";
    const existing = productTotals.get(name) ?? { name, units: 0, revenueBdt: 0 };
    existing.units += item.quantity;
    existing.revenueBdt += item.quantity * item.unit_price_bdt;
    productTotals.set(name, existing);
  }
  const bestSelling = Array.from(productTotals.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  return {
    currentRevenue,
    revenueDeltaPct: pctDelta(currentRevenue, previousRevenue),
    currentOrderCount,
    orderDeltaPct: pctDelta(currentOrderCount, previousOrderCount),
    publishedPosts: publishedPosts ?? 0,
    pendingComments: pendingComments ?? 0,
    dailyRevenue,
    statusBreakdown,
    bestSelling,
  };
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}
