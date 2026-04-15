import { Header } from "@/components/header"
import { DocumentsTable } from "@/components/documents/documents-table"

export default function DocumentsPage() {
  return (
    <>
      <Header title="Documents" description="Manage and search all documents" />
      <main className="flex-1 overflow-auto p-6">
        <DocumentsTable />
      </main>
    </>
  )
}
