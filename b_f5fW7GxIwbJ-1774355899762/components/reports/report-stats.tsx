import { FileText, Inbox, Send, FileSignature } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ReportStatsProps {
  stats: {
    total: number
    received: number
    sent: number
    contract: number
  }
}

const statMeta = [
  { key: "total", label: "Total Documents", icon: FileText, iconBg: "bg-primary/10", iconColor: "text-primary" },
  { key: "received", label: "Received", icon: Inbox, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { key: "sent", label: "Sent", icon: Send, iconBg: "bg-slate-100", iconColor: "text-slate-600" },
  { key: "contract", label: "Contract", icon: FileSignature, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
] as const

export function ReportStats({
  stats = { total: 0, received: 0, sent: 0, contract: 0 },
}: Partial<ReportStatsProps>) {
  const values = {
    total: stats.total ?? 0,
    received: stats.received ?? 0,
    sent: stats.sent ?? 0,
    contract: stats.contract ?? 0,
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {statMeta.map((stat) => (
        <Card key={stat.key} className="gap-0 p-4">
          <div className="flex items-center gap-4">
            <div className={`rounded-xl p-3 ${stat.iconBg}`}>
              <stat.icon className={`size-6 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{values[stat.key]}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
