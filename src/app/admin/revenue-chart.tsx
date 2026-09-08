"use client";

import { useId, useState } from "react";
import { formatBdt, poyshaToBdt } from "@/lib/money";
import type { DailyRevenue } from "./dashboard-data";

// Axis ticks need a compact, rounded form (no cents) — formatBdt's ৳X.XX is
// right for a tooltip/value but too busy for a repeated gridline label.
function formatTick(poysha: number): string {
  const bdt = poyshaToBdt(poysha);
  if (bdt >= 1000) return `৳${(bdt / 1000).toFixed(1)}K`;
  return `৳${Math.round(bdt)}`;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 24, left: 44 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

// Round the axis max up to a "clean" step (1/2/5 * 10^n) per the dataviz
// skill's "round to clean numbers" guidance for y-axis ticks.
function niceMax(max: number): number {
  if (max <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = useId();

  const values = data.map((d) => d.bdt);
  const rawMax = Math.max(...values, 0);
  const yMax = niceMax(rawMax || 100);
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const xFor = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * PLOT_W;
  const yFor = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(d.bdt)}`).join(" ");
  const areaPath = `${linePath} L${xFor(data.length - 1)},${PAD.top + PLOT_H} L${xFor(0)},${PAD.top + PLOT_H} Z`;

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const last = data[data.length - 1];

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (relX - PAD.left) / PLOT_W;
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(Math.min(Math.max(index, 0), data.length - 1));
  }

  return (
    <div
      className="viz-root relative"
      style={{
        // Sequential single-hue blue, per the dataviz skill's reference
        // palette (light -> dark mode swap defined below).
        ["--series-1" as string]: "#2a78d6",
        ["--surface-1" as string]: "transparent",
        ["--text-secondary" as string]: "var(--muted-foreground)",
        ["--gridline" as string]: "#e1e0d9",
      }}
    >
      <style>{`
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .viz-root { --series-1: #3987e5; --gridline: #2c2c2a; }
        }
        :root[data-theme="dark"] .viz-root { --series-1: #3987e5; --gridline: #2c2c2a; }
      `}</style>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Daily revenue for the last 30 days, ending at ${formatBdt(last?.bdt ?? 0)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={yFor(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px] tabular-nums"
            >
              {formatTick(t)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* End marker + direct label, per marks-and-anatomy: label the endpoint, not every point. */}
        <circle
          cx={xFor(data.length - 1)}
          cy={yFor(last?.bdt ?? 0)}
          r={4}
          fill="var(--series-1)"
          stroke="var(--card)"
          strokeWidth={2}
        />

        {hovered && (
          <>
            <line
              x1={xFor(hoverIndex!)}
              x2={xFor(hoverIndex!)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
            <circle
              cx={xFor(hoverIndex!)}
              cy={yFor(hovered.bdt)}
              r={4}
              fill="var(--series-1)"
              stroke="var(--card)"
              strokeWidth={2}
            />
          </>
        )}

        {/* Transparent hit layer spans the full plot for pointer tracking. */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: `${(xFor(hoverIndex!) / WIDTH) * 100}%`,
            top: `${(yFor(hovered.bdt) / HEIGHT) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <div className="font-medium tabular-nums">{formatBdt(hovered.bdt)}</div>
          <div className="text-muted-foreground">
            {new Date(hovered.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      )}
    </div>
  );
}
