import { ApiProperty } from '@nestjs/swagger';
import { SystemRole } from '../../../common/enums/system-role.enum';

export class UserResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ enum: SystemRole, nullable: true })
  systemRole: SystemRole | null;

  @ApiProperty({ nullable: true })
  roleId: string | null;

  @ApiProperty({ nullable: true })
  roleName: string | null;

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
