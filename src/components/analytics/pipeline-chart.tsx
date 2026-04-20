"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PipelineStageData } from "@/hooks/use-analytics"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  grid: "#E2E8F0",
  muted: "#94A3B8",
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function PipelineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: PipelineStageData }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-[#1A1A2E] mb-1">{data.label}</p>
      <p className="text-xs" style={{ color: data.color }}>
        Projects: {data.count}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PipelineChartProps {
  data: PipelineStageData[]
  onBarClick?: (status: string) => void
}

export function PipelineChart({ data, onBarClick }: PipelineChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A2E]">
          Pipeline Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.grid}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: COLORS.muted }}
                axisLine={{ stroke: COLORS.grid }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="label"
                type="category"
                width={110}
                tick={{ fontSize: 10, fill: COLORS.muted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<PipelineTooltip />} />
              <Bar
                dataKey="count"
                name="Projects"
                radius={[0, 4, 4, 0]}
                barSize={18}
                cursor={onBarClick ? "pointer" : undefined}
                onClick={(entry) => {
                  const data = entry as unknown as Record<string, unknown>;
                  if (onBarClick && data?.status) {
                    onBarClick(data.status as string)
                  }
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
