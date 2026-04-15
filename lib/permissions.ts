export interface AppUser {
  id: string
  role: string
  department_id: string | null
}

export interface DocumentPermissionRecord {
  uploaded_by: string | null
  department_id: string | null
  is_shared_with_user?: boolean | null
}

export function isAdmin(user: Pick<AppUser, "role">) {
  return user.role === "admin"
}

export function isManager(user: Pick<AppUser, "role">) {
  return user.role === "manager"
}

export function buildReadableDocumentAccessCondition(
  alias: string,
  user: AppUser,
  paramIndex: number
) {
  if (isAdmin(user)) {
    return {
      clause: "1=1",
      params: [] as unknown[],
      nextParamIndex: paramIndex,
    }
  }

  const clauses = [`${alias}.uploaded_by = $${paramIndex}`]
  const params: unknown[] = [user.id]
  paramIndex += 1

  clauses.push(
    `EXISTS (
      SELECT 1
      FROM document_shares ds
      WHERE ds.document_id = ${alias}.id
        AND ds.shared_with = $${paramIndex}
    )`
  )
  params.push(user.id)
  paramIndex += 1

  if (user.department_id) {
    clauses.push(`${alias}.department_id = $${paramIndex}`)
    params.push(user.department_id)
    paramIndex += 1
  }

  return {
    clause: `(${clauses.join(" OR ")})`,
    params,
    nextParamIndex: paramIndex,
  }
}

export function canReadDocument(user: AppUser, document: DocumentPermissionRecord) {
  if (isAdmin(user)) {
    return true
  }

  if (document.uploaded_by === user.id) {
    return true
  }

  if (document.is_shared_with_user) {
    return true
  }

  return !!user.department_id && document.department_id === user.department_id
}

export function canEditDocument(user: AppUser, document: DocumentPermissionRecord) {
  if (isAdmin(user)) {
    return true
  }

  if (document.uploaded_by === user.id) {
    return true
  }

  return isManager(user) && !!user.department_id && document.department_id === user.department_id
}

export function canDeleteDocument(user: AppUser, document: DocumentPermissionRecord) {
  return isAdmin(user) || document.uploaded_by === user.id
}

export function canShareDocument(user: AppUser, document: DocumentPermissionRecord) {
  if (isAdmin(user) || document.uploaded_by === user.id) {
    return true
  }

  return isManager(user) && !!user.department_id && document.department_id === user.department_id
}
