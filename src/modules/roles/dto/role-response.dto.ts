import { ApiProperty } from '@nestjs/swagger';
import { SupportedLocale } from '../../../common/types/i18n.type';

export class PermissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  resource: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty({ example: 'User Management' })
  category: string | null;
}

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ enum: ['en', 'ne'] })
  locale: SupportedLocale;

  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
