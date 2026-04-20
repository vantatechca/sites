"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TierComparisonData } from "@/hooks/use-analytics"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  basic: "#6B7280",
  pro: "#2D5A8C",
  enterprise: "#8B5CF6",
  grid: "#E2E8F0",
  muted: "#94A3B8",
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function TierTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-[#1A1A2E] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TierComparisonChartProps {
  data: TierComparisonData[]
}

export function TierComparisonChart({ data }: TierComparisonChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
          Tier Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                vertical={false}
              />
              <XAxis
                dataKey="metric"
                tick={{ fontSize: 10, fill: COLORS.muted }}
                axisLine={{ stroke: COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: COLORS.muted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TierTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="basic"
                name="Basic"
                fill={COLORS.basic}
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="pro"
                name="Pro"
                fill={COLORS.pro}
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="enterprise"
                name="Enterprise"
                fill={COLORS.enterprise}
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
