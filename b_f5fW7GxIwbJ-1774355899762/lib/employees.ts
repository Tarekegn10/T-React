import { query } from "@/lib/db"

let ensureEmployeesTablePromise: Promise<void> | null = null

export function ensureEmployeesTable() {
  if (!ensureEmployeesTablePromise) {
    ensureEmployeesTablePromise = (async () => {
      await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

      await query(`
        CREATE TABLE IF NOT EXISTS employees (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
          employee_number VARCHAR(50) UNIQUE,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          phone VARCHAR(20),
          position VARCHAR(100),
          department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          last_active TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await query(`CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)`)
    })().catch((error) => {
      ensureEmployeesTablePromise = null
      throw error
    })
  }

  return ensureEmployeesTablePromise
}
