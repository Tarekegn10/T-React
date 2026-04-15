import { query } from "@/lib/db"

let ensureDocumentsSchemaPromise: Promise<void> | null = null

export function ensureDocumentsSchema() {
  if (!ensureDocumentsSchemaPromise) {
    ensureDocumentsSchemaPromise = (async () => {
      // Office MIME types are longer than 50 chars, so keep this column unbounded.
      await query(`
        ALTER TABLE IF EXISTS documents
        ALTER COLUMN file_type TYPE TEXT
      `)
    })().catch((error) => {
      ensureDocumentsSchemaPromise = null
      throw error
    })
  }

  return ensureDocumentsSchemaPromise
}
