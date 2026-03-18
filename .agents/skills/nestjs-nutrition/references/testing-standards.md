# Testing Standards — Definitive Reference

> Every service must have unit tests. No real database in unit tests — ever.
> Replace `<Entity>`, `<ModuleName>`, `<module-name>` with your actual domain names.

---

## File Naming & Location

- Test files live **beside** the file being tested
- Naming: `<filename>.spec.ts`

```
modules/<module-name>/
├── <module-name>.service.ts
├── <module-name>.service.spec.ts  ← test beside the source
├── <module-name>.controller.ts
└── dto/
```

---

## Standard Test Module Setup

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { <ModuleName>Service } from './<module-name>.service';
import { <Entity> } from './entities/<entity>.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { AuditAction } from '../../common/enums/audit-action.enum';

describe('<ModuleName>Service', () => {
  let service: <ModuleName>Service;
  let repo: jest.Mocked<Repository<<Entity>>>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let cls: jest.Mocked<ClsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <ModuleName>Service,
        {
          provide: getRepositoryToken(<Entity>),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            findAndCount: jest.fn(),
            softDelete: jest.fn(),
            update: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: { log: jest.fn() },
        },
        {
          provide: ClsService,
          useValue: { get: jest.fn().mockReturnValue('test-user-id') },
        },
        {
          provide: Logger,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(<ModuleName>Service);
    repo = module.get(getRepositoryToken(<Entity>));
    auditLogService = module.get(AuditLogService);
    cls = module.get(ClsService);
  });

  // tests here ...
});
```

---

## What Must Be Tested for Every Service Method

### 1. Happy Path — Returns Expected Result

```typescript
describe('create', () => {
  it('should create a record and return the response', async () => {
    // Replace with your actual DTO fields
    const dto = { name: 'Test Item', amount: 100 };
    const savedEntity = {
      id: 'uuid-1', userId: 'user-1', ...dto,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    };

    repo.create.mockReturnValue(savedEntity as any);
    repo.save.mockResolvedValue(savedEntity as any);

    const result = await service.create('user-1', dto as any);

    expect(result).toBeDefined();
    expect(result.name).toBe('Test Item');
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });
});
```

### 2. Not Found — Throws `EntityNotFoundException`

```typescript
describe('findOne', () => {
  it('should throw EntityNotFoundException when record not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('nonexistent-id', 'user-1')).rejects.toThrow(EntityNotFoundException);
  });
});
```

### 3. Constraint Violation — Throws `BusinessLogicException`

```typescript
describe('create — duplicate', () => {
  it('should throw BusinessLogicException on unique constraint violation', async () => {
    const dto = { name: 'Duplicate Item', amount: 100 };
    repo.create.mockReturnValue(dto as any);
    repo.save.mockRejectedValue({ code: '23505', detail: 'Key (name)=(Duplicate Item) already exists.' });

    await expect(service.create('user-1', dto as any)).rejects.toThrow(BusinessLogicException);
  });
});
```

### 4. Audit Called on Success

```typescript
describe('create — audit', () => {
  it('should call auditLogService.log with CREATE action after successful save', async () => {
    const dto = { name: 'Item', amount: 200 };
    const saved = { id: 'uuid-1', userId: 'user-1', ...dto, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
    repo.create.mockReturnValue(saved as any);
    repo.save.mockResolvedValue(saved as any);

    await service.create('user-1', dto as any);

    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.CREATE,
        resourceId: 'uuid-1',
      }),
    );
  });
});
```

### 5. Audit NOT Called on Failure

```typescript
describe('create — audit on failure', () => {
  it('should NOT call auditLogService.log when save fails', async () => {
    const dto = { name: 'Item', amount: 200 };
    repo.create.mockReturnValue(dto as any);
    repo.save.mockRejectedValue(new Error('DB connection lost'));

    await expect(service.create('user-1', dto as any)).rejects.toThrow();
    expect(auditLogService.log).not.toHaveBeenCalled();
  });
});
```

---

## Mocking QueryBuilder

```typescript
describe('analytics', () => {
  it('should return trend data', async () => {
    const mockQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { date: new Date('2024-01-01'), total: '180' },
        { date: new Date('2024-01-02'), total: '210' },
      ]),
    };
    repo.createQueryBuilder.mockReturnValue(mockQb as any);

    const result = await service.getMetricTrend('user-1', '2024-01-01', '2024-01-02');

    expect(result.labels).toEqual(['2024-01-01', '2024-01-02']);
    expect(result.datasets[0].data).toEqual([180, 210]);
  });
});
```

---

## Mocking Patterns — Quick Reference

| Dependency | Mock Setup |
|---|---|
| Repository | `{ provide: getRepositoryToken(Entity), useValue: { findOne: jest.fn(), ... } }` |
| AuditLogService | `{ provide: AuditLogService, useValue: { log: jest.fn() } }` |
| ClsService | `{ provide: ClsService, useValue: { get: jest.fn().mockReturnValue('test-id') } }` |
| Logger | `{ provide: Logger, useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() } }` |
| ConfigService | `{ provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('value') } }` |
| JwtService | `{ provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() } }` |
| DataSource | `{ provide: DataSource, useValue: { createQueryRunner: jest.fn(), transaction: jest.fn() } }` |

---

## Testing Update — Before/After Pattern

```typescript
describe('update', () => {
  it('should update and audit with before/after snapshots', async () => {
    const before = { id: 'uuid-1', userId: 'user-1', name: 'Old', amount: 100, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
    const after = { ...before, name: 'New', amount: 200 };

    repo.findOneOrFail.mockResolvedValue(before as any);
    repo.save.mockResolvedValue(after as any);

    const result = await service.update('uuid-1', 'user-1', { name: 'New', amount: 200 } as any);

    expect(result.name).toBe('New');
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        before: expect.objectContaining({ name: 'Old' }),
        after: expect.objectContaining({ name: 'New' }),
      }),
    );
  });
});
```

---

## Rules

| Rule | Detail |
|---|---|
| No real database in unit tests | All repositories are mocked |
| No network calls | Mock all external services |
| One `describe` block per method | Keeps tests organized |
| Test file naming | `<source-file>.spec.ts` beside the source file |
| Integration/E2E tests | Separate test DB in `.env.test`. Run with `npm run test:e2e` |
| Run tests before committing | `npm run test` must pass with zero failures |

---

## npm Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```
