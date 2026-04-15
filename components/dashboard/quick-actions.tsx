import Link from "next/link"
import {
  Upload,
  Search,
  FolderPlus,
  FileBarChart,
  Send,
  Archive,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const actions = [
  { label: "Upload Document", icon: Upload, href: "/upload", color: "text-primary" },
  { label: "Search", icon: Search, href: "/search", color: "text-foreground" },
  { label: "New Category", icon: FolderPlus, href: "/categories", color: "text-primary" },
  { label: "Create Report", icon: FileBarChart, href: "/reports", color: "text-primary" },
  { label: "Send Document", icon: Send, href: "/documents", color: "text-primary" },
  { label: "Archive", icon: Archive, href: "/documents", color: "text-foreground" },
]

export function QuickActions() {
  return (
    <Card className="gap-0">
      <CardHeader className="py-4">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors group"
            >
              <action.icon className={`size-5 ${action.color} group-hover:text-primary transition-colors`} />
              <span className="text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
