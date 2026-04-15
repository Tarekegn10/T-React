"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DepartmentChartItem {
  department: string
  count: number | string
}

const chartConfig = {
  documents: {
    label: "Documents",
    color: "#3b82f6",
  },
}

export function DepartmentChart({ data = [] }: { data?: DepartmentChartItem[] }) {
  const normalized = data.map((item) => ({
    department: item.department,
    documents: Number(item.count || 0),
  }))

  return (
    <Card className="gap-0">
      <CardHeader className="py-4">
        <CardTitle className="text-base font-semibold">Documents by Department</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={normalized}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="department"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                width={70}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="documents"
                fill={chartConfig.documents.color}
                radius={[0, 4, 4, 0]}
                name="Documents"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
