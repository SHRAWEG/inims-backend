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
export function sanitizeForAudit(data: any): Record<string, any> {
  const sanitized = { ...(data as Record<string, any>) };
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}
