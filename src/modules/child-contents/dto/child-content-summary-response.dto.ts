import { ApiProperty } from '@nestjs/swagger';

export class ChildContentSummaryResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Section 1' })
  title: string;

  @ApiProperty({ example: 'section-1' })
  slug: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
