export const USER_ROLES = ['admin', 'colaborador'] as const

export type UserRole = (typeof USER_ROLES)[number]

export function normalizeUserRole(role?: string | null): UserRole | null {
  const normalizedRole = role?.trim().toLowerCase()

  if (!normalizedRole) {
    return null
  }

  return USER_ROLES.includes(normalizedRole as UserRole)
    ? (normalizedRole as UserRole)
    : null
}