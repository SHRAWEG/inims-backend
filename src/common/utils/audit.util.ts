const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'hashedRefreshToken',
  'accessToken',
  'refreshToken',
  'secret',
  'token',
];

/**
 * Strips sensitive fields from an object before storing in audit logs.
 * Replaces values with '[REDACTED]'.
 */
export function sanitizeForAudit(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}
