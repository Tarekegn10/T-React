import { Header } from "@/components/header"
import { UploadZone } from "@/components/upload/upload-zone"
import { RecentUploads } from "@/components/upload/recent-uploads"

export default function UploadPage() {
  return (
    <>
      <Header title="Upload Documents" description="Add new documents to the system" />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <UploadZone />
        <RecentUploads />
      </main>
    </>
  )
}
