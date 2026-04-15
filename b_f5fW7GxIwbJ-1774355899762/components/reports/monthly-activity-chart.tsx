"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface MonthlyActivityPoint {
  month: string
  received: number | string
  sent: number | string
  contract: number | string
}

const chartConfig = {
  received: { label: "Received", color: "#3b82f6" },
  sent: { label: "Sent", color: "#22c55e" },
  contract: { label: "Contract", color: "#f59e0b" },
}

export function MonthlyActivityChart({ data = [] }: { data?: MonthlyActivityPoint[] }) {
  const normalized = data.map((item) => ({
    month: item.month,
    received: Number(item.received || 0),
    sent: Number(item.sent || 0),
    contract: Number(item.contract || 0),
  }))

  return (
    <Card className="gap-0">
      <CardHeader className="py-4">
        <CardTitle className="text-base font-semibold">Monthly Document Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={normalized} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="received" fill={chartConfig.received.color} radius={[4, 4, 0, 0]} name="Received" />
              <Bar dataKey="sent" fill={chartConfig.sent.color} radius={[4, 4, 0, 0]} name="Sent" />
              <Bar dataKey="contract" fill={chartConfig.contract.color} radius={[4, 4, 0, 0]} name="Contract" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
