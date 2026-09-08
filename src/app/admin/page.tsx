import { ShoppingCart, Wallet, FileText, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBdt } from "@/lib/money";
import { getDashboardData } from "./dashboard-data";
import { StatTile } from "./stat-tile";
import { RevenueChart } from "./revenue-chart";
import { OrderStatusList } from "./order-status-list";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Revenue"
          value={formatBdt(data.currentRevenue)}
          deltaPct={data.revenueDeltaPct}
          icon={Wallet}
        />
        <StatTile
          label="Orders"
          value={String(data.currentOrderCount)}
          deltaPct={data.orderDeltaPct}
          icon={ShoppingCart}
        />
        <StatTile label="Published posts" value={String(data.publishedPosts)} icon={FileText} />
        <StatTile
          label="Pending comments"
          value={String(data.pendingComments)}
          icon={MessageSquare}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h2 className="font-medium">Revenue</h2>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </div>
          <RevenueChart data={data.dailyRevenue} />
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-medium">Order status</h2>
          <OrderStatusList counts={data.statusBreakdown} />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-medium">Best selling products</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Units sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.bestSelling.map((p) => (
              <TableRow key={p.name}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right tabular-nums">{p.units}</TableCell>
                <TableCell className="text-right tabular-nums">{formatBdt(p.revenueBdt)}</TableCell>
              </TableRow>
            ))}
            {data.bestSelling.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No sales yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
