# TypeORM Patterns — Definitive Reference

> Read this before writing any TypeORM-related code. Every pattern uses generic entity names — replace `Item`, `Category`, `Entry` with your actual domain entities.

---

## Section 1 — Error Handling: try/catch Rules

### Standard Service Method Pattern

```typescript
// Replace Item with your actual entity name
async create(userId: string, dto: CreateItemDto): Promise<ItemResponseDto> {
  try {
    const entity = this.itemRepository.create({ ...dto, userId });
    const saved = await this.itemRepository.save(entity);

    // Audit — after successful save
    await this.auditLogService.log({
      action: AuditAction.CREATE,
      resource: 'item',
      resourceId: saved.id,
      after: saved,
    });

    return this.toResponseDto(saved);
  } catch (error) {
    this.logger.error('Failed to create item', { error: error.message, stack: error.stack, userId });
    this.handleDbError(error, 'ItemsService.create');
  }
}
```

### `handleDbError()` — Every Service Must Have This

```typescript
/**
 * Translates raw database errors into typed exceptions.
 * NEVER let PG errors bubble to the controller.
 */
private handleDbError(error: any, context: string): never {
  // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  if (error?.code === '23505') {
    // Unique constraint violation
    const detail = error.detail ?? 'Duplicate value';
    throw new BusinessLogicException(`Duplicate entry: ${detail}`);
  }
  if (error?.code === '23503') {
    // Foreign key constraint violation
    throw new BusinessLogicException('Referenced record does not exist');
  }
  if (error?.code === '23502') {
    // Not null violation
    const column = error.column ?? 'unknown';
    throw new BusinessLogicException(`Missing required field: ${column}`);
  }
  if (error instanceof EntityNotFoundError) {
    throw new EntityNotFoundException('Record', error.message);
  }
  // Re-throw custom exceptions as-is (already handled)
  if (error instanceof HttpException) throw error;
  // Anything else → 500
  throw error;
}
```

### Rules

| Rule | Why |
|---|---|
| Every method that touches the DB is in try/catch | Prevents raw PG errors from reaching clients |
| `handleDbError()` goes last in the catch block | Centralizes error translation |
| `EntityNotFoundError` is caught separately | 404 vs 500 distinction |
| PG error codes `23505`, `23503`, `23502` are always checked | Most common constraint violations |
| `this.logger.error()` runs before rethrowing | Every error is logged with full context |

---

## Section 2 — Transactions

### When to Use Transactions

| Scenario | Transaction? |
|---|---|
| Single `save()` or `update()` | No — TypeORM wraps single ops |
| Multiple related writes that must all succeed | **Yes** |
| Write + dependent write (e.g., parent + child) | **Yes** |
| Read-only queries | No |

### Pattern A — `QueryRunner` (Full Control)

```typescript
// Replace Item and ChildEntry with your actual entity names
async createWithChildren(userId: string, dto: CreateItemWithChildrenDto): Promise<ItemResponseDto> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Create parent record
    const parent = queryRunner.manager.create(Item, {
      name: dto.name,
      userId,
    });
    const savedParent = await queryRunner.manager.save(parent);

    // 2. Create child records
    const children = dto.entries.map((entry) =>
      queryRunner.manager.create(ChildEntry, {
        ...entry,
        parentId: savedParent.id,
      }),
    );
    await queryRunner.manager.save(children);

    // 3. Commit
    await queryRunner.commitTransaction();

    // 4. Audit AFTER commit — never inside the transaction
    await this.auditLogService.log({
      action: AuditAction.CREATE,
      resource: 'item',
      resourceId: savedParent.id,
      after: { ...savedParent, entries: children },
    });

    return this.toResponseDto(savedParent, children);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    this.logger.error('Transaction failed: createWithChildren', {
      error: error.message, stack: error.stack, userId,
    });
    this.handleDbError(error, 'ItemsService.createWithChildren');
  } finally {
    await queryRunner.release(); // ALWAYS release — even on error
  }
}
```

### Pattern B — `DataSource.transaction()` Callback (Simpler)

```typescript
// Use for simpler multi-write operations
async transferItem(fromId: string, toId: string, itemId: string): Promise<void> {
  await this.dataSource.transaction(async (manager) => {
    const item = await manager.findOneOrFail(Item, { where: { id: itemId } });
    item.ownerId = toId;
    await manager.save(item);

    const log = manager.create(TransferLog, { itemId, fromId, toId });
    await manager.save(log);
  });
}
```

### Transaction Rules

| Rule | Details |
|---|---|
| Use `QueryRunner` for multi-entity or complex flows | You control connect, start, commit, rollback, release |
| Use `DataSource.transaction()` for simpler saves | Auto-commit/rollback |
| Release `QueryRunner` in `finally` | Prevents connection leaks — CRITICAL |
| Audit AFTER `commitTransaction()` | Audit log is only created if main operation succeeded |
| Never nest transactions | TypeORM does not support true nested transactions |

---

## Section 3 — Cascade vs. Guarded Deletes

### Cascade Delete — Use When Child Cannot Exist Without Parent

```typescript
// Entity setup — parent side
@Entity('items')
export class Item extends BaseEntity {
  @OneToMany(() => ChildEntry, (child) => child.parent, {
    cascade: true,      // save/remove cascade
    eager: false,
  })
  entries: ChildEntry[];
}

// Migration — DB enforces cascade
ALTER TABLE child_entries
ADD CONSTRAINT fk_child_entries_item_id
FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE;
```

### Guarded Delete — Use When Deletion Must Be Prevented If Children Exist

```typescript
// In the service — check before deleting
async remove(id: string, userId: string): Promise<void> {
  const item = await this.findOneOrFail(id, userId);

  // Guard: prevent delete if children exist
  const childCount = await this.childEntryRepository.count({
    where: { parentId: id },
  });
  if (childCount > 0) {
    throw new BusinessLogicException(
      `Cannot delete item: ${childCount} entries still linked. Delete entries first.`,
    );
  }

  await this.itemRepository.softDelete(id);

  await this.auditLogService.log({
    action: AuditAction.SOFT_DELETE,
    resource: 'item',
    resourceId: id,
    before: item,
  });
}
```

### Decision Guide

| Relationship | Strategy | DB Constraint |
|---|---|---|
| Parent → Children that can't exist independently | CASCADE | `ON DELETE CASCADE` |
| Parent → Children that may exist independently | RESTRICT with service guard | `ON DELETE RESTRICT` |
| User → User's records | CASCADE | `ON DELETE CASCADE` |
| Record → Audit logs | No FK | No constraint |

---

## Section 4 — Query Patterns

### 4.1 — `findOne` / `findOneOrFail`

```typescript
// findOne — returns null if not found
const item = await this.itemRepository.findOne({
  where: { id, userId },
  relations: ['category'],    // eager-load the relationship
});
if (!item) throw new EntityNotFoundException('Item', id);

// findOneOrFail — throws EntityNotFoundError (caught by handleDbError)
const item = await this.itemRepository.findOneOrFail({
  where: { id, userId },
});
```

### 4.2 — `findAndCount` for Pagination

```typescript
async findAllPaginated(userId: string, query: PaginationQueryDto): Promise<PaginatedResult<ItemResponseDto>> {
  const [entities, total] = await this.itemRepository.findAndCount({
    where: { userId },
    order: { createdAt: 'DESC' },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    relations: ['category'],
  });

  return {
    data: entities.map((e) => this.toResponseDto(e)),
    meta: buildPaginationMeta(total, query.page, query.limit),
  };
}
```

### 4.3 — `QueryBuilder` for Joins & Aggregates

```typescript
// Complex query with joins and filtering
const items = await this.itemRepository
  .createQueryBuilder('item')
  .leftJoinAndSelect('item.category', 'category')
  .where('item.user_id = :userId', { userId })
  .andWhere('category.name = :categoryName', { categoryName })
  .andWhere('item.deleted_at IS NULL')
  .orderBy('item.created_at', 'DESC')
  .skip(offset)
  .take(limit)
  .getMany();

// Aggregation query
const result = await this.itemRepository
  .createQueryBuilder('item')
  .select("DATE_TRUNC('day', item.created_at)::date", 'date')
  .addSelect('SUM(item.amount)', 'total')
  .addSelect('COUNT(item.id)', 'count')
  .where('item.user_id = :userId', { userId })
  .andWhere('item.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
  .andWhere('item.deleted_at IS NULL')
  .groupBy("DATE_TRUNC('day', item.created_at)")
  .orderBy('date', 'ASC')
  .getRawMany();
```

### 4.4 — `save` vs `update`

| Method | When to Use |
|---|---|
| `repository.save(entity)` | Creating new records, or updating with full entity (triggers lifecycle hooks, cascades) |
| `repository.update(id, partial)` | Partial update without loading entity first (no hooks, no cascades, faster) |

```typescript
// save — creates or updates, triggers hooks
const entity = this.itemRepository.create(dto);
const saved = await this.itemRepository.save(entity);

// update — partial update, no hooks
await this.itemRepository.update(id, { status: 'COMPLETED' });
```

### 4.5 — Raw Queries (Use Sparingly)

```typescript
// Only for complex SQL that QueryBuilder can't express cleanly
const results = await this.dataSource.query(
  `SELECT
     date_trunc('month', created_at) as month,
     COUNT(*) as count,
     SUM(amount) as total
   FROM items
   WHERE user_id = $1 AND deleted_at IS NULL
   GROUP BY month
   ORDER BY month DESC`,
  [userId],
);
```

> **Rule**: Always use parameterized queries (`$1`, `$2`). Never concatenate user input into SQL strings.

### 4.6 — Cursor-Based Pagination

```typescript
// For infinite scroll / large datasets
async findAfterCursor(userId: string, cursor: string | null, limit: number): Promise<{
  data: ItemResponseDto[];
  nextCursor: string | null;
}> {
  const qb = this.itemRepository
    .createQueryBuilder('item')
    .where('item.user_id = :userId', { userId })
    .andWhere('item.deleted_at IS NULL')
    .orderBy('item.created_at', 'DESC')
    .take(limit + 1); // fetch one extra to determine if there are more

  if (cursor) {
    qb.andWhere('item.created_at < :cursor', { cursor });
  }

  const results = await qb.getMany();
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;

  return {
    data: data.map((e) => this.toResponseDto(e)),
    nextCursor: hasMore ? data[data.length - 1].createdAt.toISOString() : null,
  };
}
```

---

## Section 5 — Soft Delete

### Setup (Already in BaseEntity)

```typescript
// BaseEntity already includes:
@DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
deletedAt: Date | null;
```

### Operations

```typescript
// Soft delete — sets deleted_at, does NOT physically remove
await this.itemRepository.softDelete(id);

// Restore — clears deleted_at
await this.itemRepository.restore(id);

// Query including soft-deleted records (admin view)
const allItems = await this.itemRepository.find({
  where: { userId },
  withDeleted: true,
});

// Query ONLY soft-deleted records
const deletedItems = await this.itemRepository
  .createQueryBuilder('item')
  .withDeleted()
  .where('item.user_id = :userId', { userId })
  .andWhere('item.deleted_at IS NOT NULL')
  .getMany();
```

### Rules

| Rule | Details |
|---|---|
| Default queries exclude soft-deleted | TypeORM filters `deleted_at IS NULL` automatically |
| Use `withDeleted: true` or `.withDeleted()` to include | Needed for admin views |
| Always soft-delete, never hard-delete | Unless legally required (GDPR purge) |
| Analytics queries must include `AND deleted_at IS NULL` | QueryBuilder raw queries don't auto-filter |

---

## Section 6 — N+1 Problem — Detection & Prevention

### What Is N+1?

Loading a list of N entities, then making 1 additional query per entity to load a relation = N+1 queries total.

### How to Prevent

```typescript
// ✅ Use relations option (find methods)
const items = await this.itemRepository.find({
  where: { userId },
  relations: ['category', 'tags'],
});

// ✅ Use leftJoinAndSelect (QueryBuilder)
const items = await this.itemRepository
  .createQueryBuilder('item')
  .leftJoinAndSelect('item.category', 'category')
  .leftJoinAndSelect('item.tags', 'tag')
  .where('item.user_id = :userId', { userId })
  .getMany();

// ✅ Use IN query to batch-load related data
const categoryIds = items.map((i) => i.categoryId);
const categories = await this.categoryRepository.find({
  where: { id: In(categoryIds) },
});
```

### How to Detect — Checklist

- [ ] Does the service method load a list of entities?
- [ ] Does it then loop over each entity and access a lazy relation?
- [ ] Does it call a separate `findOne` inside a `for` loop?
- [ ] Is `logging: true` in TypeORM config? Check the generated SQL — if you see repeated SELECT statements, you have N+1.

### Common N+1 Patterns to Avoid

```typescript
// ❌ N+1 — DO NOT DO THIS
const items = await this.itemRepository.find({ where: { userId } });
for (const item of items) {
  const category = await this.categoryRepository.findOne({ where: { id: item.categoryId } });
  item.categoryName = category.name; // triggers 1 query per item
}

// ✅ Fix — batch load in one query
const items = await this.itemRepository.find({
  where: { userId },
  relations: ['category'],
});
```
