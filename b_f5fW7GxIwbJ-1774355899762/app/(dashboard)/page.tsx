import { Header } from "@/components/header"
import { DashboardStats } from "@/components/dashboard/stats"
import { RecentDocuments } from "@/components/dashboard/recent-documents"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" description="Overview of documents, activity, and system status" />
      <main className="flex-1 overflow-auto p-6">
        <DashboardStats />
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentDocuments />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>
      </main>
    </>
  )
}
