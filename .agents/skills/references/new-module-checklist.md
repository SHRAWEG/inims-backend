# New Module Checklist

> Every time a new feature module is created, follow this checklist in order. Do not skip steps.
> Replace `<module-name>` and `<Entity>` with your actual domain names.

---

## 1. Generate Files

- [ ] Create module folder: `src/modules/<module-name>/`
- [ ] Create `<module-name>.module.ts`
- [ ] Create `<module-name>.controller.ts`
- [ ] Create `<module-name>.service.ts`
- [ ] Create `dto/` folder with:
  - [ ] `create-<entity>.dto.ts` — all required fields, class-validator decorators, `@ApiProperty()` on every field
  - [ ] `update-<entity>.dto.ts` — extends `PartialType(CreateDto)`
  - [ ] `<entity>-response.dto.ts` — response shape, explicitly omits sensitive fields
  - [ ] `query-<entity>.dto.ts` (if paginated) — extends `PaginationQueryDto`
- [ ] Create `entities/` folder (if module owns DB tables)
- [ ] Create `types/` folder (if module has local-only types)

### Naming Rules

- Folder name: `kebab-case` matching the domain (e.g., `orders/`, `products/`)
- File names: `kebab-case` (e.g., `orders.service.ts`)
- Class names: `PascalCase` (e.g., `OrdersService`)
- See [conventions.md](conventions.md) for the complete naming reference

---

## 2. Entity Setup (If Module Has Entities)

- [ ] Entity class extends `BaseEntity` (from `common/entities/base.entity.ts`)
- [ ] Entity uses `@Entity('table_name')` with `snake_case` plural table name
- [ ] All columns use `{ name: 'snake_case_name' }` option
- [ ] All FK columns have `@Index()`
- [ ] Frequently queried / sorted columns have `@Index()`
- [ ] Cascade rules (`onDelete`) explicitly defined on all relations
- [ ] `decimal` type used for monetary/measurement values: `@Column({ type: 'decimal', precision: 10, scale: 2 })`
- [ ] Soft delete inherited from `BaseEntity` (`deletedAt` column)

### Generate & Run Migration

```bash
# Generate migration from entity changes
npm run migration:generate -- src/database/migrations/Create<Entity>Table

# REVIEW the generated SQL before running — never blindly apply
# Check: column types, indexes, FK constraints, ON DELETE rules

# Run the migration
npm run migration:run
```

- [ ] Migration generated via CLI (never hand-written)
- [ ] Migration SQL reviewed before running
- [ ] Migration applied successfully

---

## 3. Module Wiring

```typescript
// Replace <Entity>, <ModuleName>, <module-name> with your actual names
@Module({
  imports: [TypeOrmModule.forFeature([<Entity>])],
  controllers: [<ModuleName>Controller],
  providers: [<ModuleName>Service],
  exports: [<ModuleName>Service],
})
export class <ModuleName>Module {}
```

- [ ] Entity added to `TypeOrmModule.forFeature([])` in module file
- [ ] `AuditLogModule` does NOT need to be imported (it's `@Global()`)
- [ ] Module registered in `AppModule` imports array

---

## 4. Controller Setup

```typescript
@ApiTags('<module-name>')
@ApiBearerAuth('access-token')
@Controller('<module-name>')
export class <ModuleName>Controller {
  constructor(private readonly service: <ModuleName>Service) {}
}
```

- [ ] `@ApiTags('<module-name>')` added
- [ ] `@ApiBearerAuth('access-token')` added (if protected)
- [ ] `@Roles(UserRole.ADMIN)` added on admin-only endpoints
- [ ] Every endpoint has `@ApiOperation({ summary: '...' })`
- [ ] Every endpoint has `@ApiResponse()` for success and error codes
- [ ] `@HttpCode(HttpStatus.CREATED)` on POST endpoints that create resources
- [ ] Controller methods are thin — only parse request, call service, return result
- [ ] Uses `@CurrentUser()` instead of `@Req()` for user context

---

## 5. Service Setup

```typescript
@Injectable()
export class <ModuleName>Service {
  private readonly logger = new Logger(<ModuleName>Service.name);

  constructor(
    @InjectRepository(<Entity>)
    private readonly repository: Repository<<Entity>>,
    private readonly auditLogService: AuditLogService,
  ) {}
}
```

- [ ] `Logger` injected: `private readonly logger = new Logger(<ServiceName>.name)`
- [ ] `AuditLogService` injected (global — no module import needed)
- [ ] Repository injected via `@InjectRepository(<Entity>)`
- [ ] Every method wrapped in try/catch following the [standard pattern](typeorm-patterns.md)
- [ ] `handleDbError()` private method present (from typeorm-patterns.md)
- [ ] Every `catch` block calls `this.logger.error()` before rethrowing
- [ ] Every mutating method calls `auditLogService.log()` after the operation succeeds
- [ ] Audit log called with correct `AuditAction` (CREATE, UPDATE, SOFT_DELETE, RESTORE)
- [ ] For UPDATE: `before` snapshot loaded before mutation
- [ ] Service methods return typed response objects — never raw entities

---

## 6. Testing

Create `<module-name>.service.spec.ts` beside the service file.

```typescript
describe('<ModuleName>Service', () => {
  let service: <ModuleName>Service;
  let repo: jest.Mocked<Repository<<Entity>>>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        <ModuleName>Service,
        {
          provide: getRepositoryToken(<Entity>),
          useValue: {
            create: jest.fn(), save: jest.fn(), findOne: jest.fn(),
            findOneOrFail: jest.fn(), findAndCount: jest.fn(),
            softDelete: jest.fn(), update: jest.fn(),
          },
        },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() } },
      ],
    }).compile();

    service = module.get(<ModuleName>Service);
    repo = module.get(getRepositoryToken(<Entity>));
    auditLogService = module.get(AuditLogService);
  });
});
```

- [ ] Test file created
- [ ] All repositories mocked — no real DB
- [ ] `AuditLogService` mocked
- [ ] Happy path tested for each service method
- [ ] `EntityNotFoundException` tested when record not found
- [ ] `BusinessValidationException` tested for constraint violations
- [ ] Audit `log()` verified as called on success, NOT called on failure

---

## Quick Validation

- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] `npm run test` — new tests pass
- [ ] Migration applied and verified in DB
- [ ] Swagger docs render correctly at `/api/v1/docs`
- [ ] All endpoints tested via Swagger or curl
