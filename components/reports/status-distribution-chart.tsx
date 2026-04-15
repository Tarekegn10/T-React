"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface StatusDistributionItem {
  status: string
  count: number | string
}

const colorMap: Record<string, string> = {
  approved: "#22c55e",
  pending: "#f59e0b",
  received: "#3b82f6",
  sent: "#1e40af",
  archived: "#9ca3af",
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Unknown"
  }

  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function StatusDistributionChart({
  data = [],
}: {
  data?: StatusDistributionItem[]
}) {
  const normalized = data.map((item) => ({
    name: formatLabel(item.status),
    value: Number(item.count || 0),
    color: colorMap[item.status] || "#64748b",
  }))

  const chartConfig = Object.fromEntries(
    normalized.map((item) => [
      item.name.toLowerCase(),
      { label: item.name, color: item.color },
    ])
  )

  return (
    <Card className="gap-0">
      <CardHeader className="py-4">
        <CardTitle className="text-base font-semibold">Document Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={normalized}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {normalized.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
