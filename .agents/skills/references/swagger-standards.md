# Swagger Documentation Standards

> No endpoint ships without full Swagger documentation. Every controller and every endpoint must have the decorators documented here.
> Replace `<Entity>`, `<module-name>`, `<EntityResponseDto>` with your actual domain names.

---

## Controller-Level Decorators — Required on Every Controller

```typescript
@ApiTags('<module-name>')                // Groups endpoints in Swagger UI
@ApiBearerAuth('access-token')          // Shows 🔒 lock icon — matches bearer scheme name in main.ts
@Controller('<module-name>')
export class <ModuleName>Controller { ... }
```

### Public Controllers (e.g., Auth)

```typescript
@ApiTags('auth')
@Controller('auth')                      // NO @ApiBearerAuth() — public endpoints
export class AuthController { ... }
```

> **Rule**: `@ApiTags()` value must match the controller's route prefix (kebab-case).

---

## Endpoint-Level Decorators — Required on Every Endpoint

### Minimum Required

```typescript
@ApiOperation({ summary: 'Create a new record' })
@ApiResponse({ status: 201, description: 'Created successfully', type: <EntityResponseDto> })
@ApiResponse({ status: 400, description: 'Validation failed' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
```

### By HTTP Method

#### POST (Create)

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ summary: 'Create a new <entity>' })
@ApiResponse({ status: 201, description: 'Created successfully', type: <EntityResponseDto> })
@ApiResponse({ status: 400, description: 'Validation failed' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 422, description: 'Business logic error' })
async create(@CurrentUser() user: UserContext, @Body() dto: Create<Entity>Dto) { ... }
```

#### GET (Single)

```typescript
@Get(':id')
@ApiOperation({ summary: 'Get a <entity> by ID' })
@ApiParam({ name: 'id', type: 'string', format: 'uuid' })
@ApiResponse({ status: 200, description: 'Success', type: <EntityResponseDto> })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 404, description: 'Not found' })
async findOne(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string) { ... }
```

#### GET (Paginated List)

```typescript
@Get()
@ApiOperation({ summary: 'List records (paginated)' })
@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
@ApiResponse({ status: 200, description: 'Paginated list' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async findAll(@CurrentUser() user: UserContext, @Query() query: Query<Entity>Dto) { ... }
```

#### PATCH (Update)

```typescript
@Patch(':id')
@ApiOperation({ summary: 'Update a <entity>' })
@ApiParam({ name: 'id', type: 'string', format: 'uuid' })
@ApiResponse({ status: 200, description: 'Updated', type: <EntityResponseDto> })
@ApiResponse({ status: 400, description: 'Validation failed' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 404, description: 'Not found' })
async update(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: Update<Entity>Dto) { ... }
```

#### DELETE

```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiOperation({ summary: 'Delete a <entity> (soft delete)' })
@ApiParam({ name: 'id', type: 'string', format: 'uuid' })
@ApiResponse({ status: 204, description: 'Deleted' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 404, description: 'Not found' })
async remove(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string) { ... }
```

---

## DTO `@ApiProperty()` — Required on Every Field

### Rules

- Every field must have `@ApiProperty()` (or `@ApiPropertyOptional()` for optional fields)
- Always include `example` — not just a type declaration
- Include `description` for non-obvious fields
- Include `enum` for enum fields

### Examples by Field Type

```typescript
// UUID
@ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Unique identifier' })
id: string;

// Email
@ApiProperty({ example: 'user@example.com' })
@IsEmail()
email: string;

// String
@ApiProperty({ example: 'Test Item', maxLength: 255 })
@IsString() @MaxLength(255)
name: string;

// Number
@ApiProperty({ example: 99.99, minimum: 0, description: 'Price in USD' })
@IsNumber() @Min(0)
price: number;

// Number (query param)
@ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
@IsOptional() @Type(() => Number) @IsInt() @Min(1)
page: number = 1;

// Date string
@ApiProperty({ example: '2024-01-15', description: 'ISO date string' })
@IsDateString()
startDate: string;

// Enum
@ApiProperty({ example: 'PENDING', enum: OrderStatus })
@IsEnum(OrderStatus)
status: OrderStatus;

// Boolean
@ApiPropertyOptional({ example: true, default: true })
@IsOptional() @IsBoolean()
isActive?: boolean;

// Nested object
@ApiProperty({ type: () => AddressDto })
@ValidateNested() @Type(() => AddressDto)
address: AddressDto;

// Array of strings
@ApiProperty({ example: ['tag1', 'tag2'], type: [String] })
@IsArray() @IsString({ each: true })
tags: string[];

// UUID (foreign key)
@ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
@IsUUID()
categoryId: string;
```

---

## Swagger Setup in `main.ts`

```typescript
if (nodeEnv !== 'production') {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('My API')                   // Replace with your project name
    .setDescription('API documentation')
    .setVersion(require('../package.json').version)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter your JWT access token' },
      'access-token',   // Must match @ApiBearerAuth('access-token')
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);
}
```

---

## Paginated Response — Swagger Schema

```typescript
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

@ApiExtraModels(<EntityResponseDto>)
@ApiOkResponse({
  description: 'Paginated list',
  schema: {
    properties: {
      success: { type: 'boolean', example: true },
      data: { type: 'array', items: { $ref: getSchemaPath(<EntityResponseDto>) } },
      meta: {
        type: 'object',
        properties: {
          total: { type: 'number', example: 100 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 20 },
          totalPages: { type: 'number', example: 5 },
        },
      },
      message: { type: 'string', example: 'OK' },
    },
  },
})
async findAll(@Query() query: PaginationQueryDto) { ... }
```

---

## Checklist — Before Merging Any Controller

- [ ] `@ApiTags()` on controller class
- [ ] `@ApiBearerAuth('access-token')` on protected controllers
- [ ] `@ApiOperation({ summary })` on every endpoint
- [ ] `@ApiResponse({ status, description })` for all expected status codes
- [ ] `@ApiParam()` on all path parameters
- [ ] `@ApiQuery()` on all query parameters (or DTO with `@ApiPropertyOptional()`)
- [ ] `@ApiProperty()` with `example` on every DTO field
- [ ] Public endpoints: `@Public()` decorator, no `@ApiBearerAuth()`
- [ ] Swagger UI renders correctly at `/api/v1/docs`
