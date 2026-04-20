"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RevenueDataPoint } from "@/hooks/use-analytics"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  collected: "#10B981",
  outstanding: "#F59E0B",
  projected: "#2D5A8C",
  grid: "#E2E8F0",
  muted: "#94A3B8",
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-[#1A1A2E] mb-1">{label}</p>
      {payload.map((entry, i) => {
        if (entry.value === 0 && entry.dataKey === "projected") return null
        return (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RevenueChartProps {
  data: RevenueDataPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
          Revenue (Collected vs Outstanding)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id="collectedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={COLORS.collected}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.collected}
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient
                  id="outstandingGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={COLORS.outstanding}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.outstanding}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: COLORS.muted }}
                axisLine={{ stroke: COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: COLORS.muted }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  `$${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip content={<RevenueTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="collected"
                name="Collected"
                stroke={COLORS.collected}
                strokeWidth={2}
                fill="url(#collectedGradient)"
                dot={{ r: 3, fill: COLORS.collected }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="outstanding"
                name="Outstanding"
                stroke={COLORS.outstanding}
                strokeWidth={2}
                fill="url(#outstandingGradient)"
                dot={{ r: 3, fill: COLORS.outstanding }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected"
                stroke={COLORS.projected}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
