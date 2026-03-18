# Dependencies — Canonical Package List

> Install these packages when bootstrapping any NestJS + PostgreSQL project using this skill.

---

## Always Install

```bash
# ── Core Framework ──
npm install @nestjs/config                # Environment variable management
npm install @nestjs/jwt                   # JWT token generation/verification
npm install @nestjs/passport              # Passport integration for NestJS
npm install passport passport-jwt         # JWT authentication strategy
npm install @nestjs/typeorm typeorm pg    # PostgreSQL ORM
npm install class-validator class-transformer  # DTO validation & transformation
npm install nestjs-cls                    # Request-scoped context (for audit logging)
npm install bcrypt                        # Password hashing

# ── Security & Performance ──
npm install helmet                        # Security headers
npm install compression                   # Gzip response compression

# ── Logging ──
npm install winston nest-winston          # Structured logging

# ── Swagger ──
npm install @nestjs/swagger swagger-ui-express  # API documentation

# ── Configuration Validation ──
npm install joi                           # Env var validation schema at startup

# ── Utilities ──
npm install microdiff                     # Object diff for audit log change tracking

# ── Dev Dependencies ──
npm install -D @types/passport-jwt        # Passport JWT type definitions
npm install -D @types/bcrypt              # Bcrypt type definitions
npm install -D @types/compression         # Compression type definitions
npm install -D husky                      # Pre-commit hooks
```

### One-Line Install (Copy-Paste)

```bash
# Production dependencies
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/typeorm typeorm pg class-validator class-transformer nestjs-cls bcrypt helmet compression winston nest-winston @nestjs/swagger swagger-ui-express joi microdiff

# Dev dependencies
npm install -D @types/passport-jwt @types/bcrypt @types/compression husky
```

---

## Install Only If Needed

### Charts / Analytics Module

```bash
npm install date-fns    # Date range calculations, formatting, grouping
```

> Install when: Project has an analytics module with time-series charts, date grouping, or date range queries.

### File Uploads

```bash
npm install @nestjs/platform-express multer
npm install -D @types/multer
```

> Install when: Project accepts file uploads (images, documents, CSV imports, etc.).

### Email Sending

```bash
npm install @nestjs-modules/mailer nodemailer handlebars
npm install -D @types/nodemailer
```

> Install when: Project sends transactional emails (verification, password reset, notifications).

### Rate Limiting

```bash
npm install @nestjs/throttler
```

> Install when: Project has public-facing APIs that need rate limiting.

### Caching

```bash
npm install @nestjs/cache-manager cache-manager
```

> Install when: Project needs response caching or in-memory caching.

### Task Scheduling

```bash
npm install @nestjs/schedule
npm install -D @types/cron
```

> Install when: Project has background jobs, cron tasks, or periodic data processing.

### WebSockets

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install -D @types/socket.io
```

> Install when: Project needs real-time communication (live dashboards, chat, notifications).

---

## Never Install

| Package | Reason | Alternative |
|---|---|---|
| `moment` | Deprecated, heavy bundle | `date-fns` (tree-shakeable, immutable) |
| `lodash` | Usually unnecessary, heavy | Native JS methods or specific utility packages |
| `mongoose` | This skill is PostgreSQL only | `typeorm` with `pg` |
| Any non-TypeORM ORM | Inconsistent with skill patterns | `typeorm` |
| `express-validator` | Conflicts with class-validator | `class-validator` + `class-transformer` |
| `dotenv` | `@nestjs/config` handles this | `@nestjs/config` |
| `jsonwebtoken` directly | `@nestjs/jwt` wraps it correctly | `@nestjs/jwt` |

---

## Version Pinning

- Always use exact versions in `package.json` for critical packages — especially `typeorm` and `@nestjs/*`.
- Run `npm audit` periodically to check for vulnerabilities.
- Update dependencies in a separate branch and test before merging.
