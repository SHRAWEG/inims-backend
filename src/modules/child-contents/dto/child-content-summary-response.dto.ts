import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ParentSummary {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'About Us' })
  title: string;

  @ApiProperty({ example: 'about-us' })
  slug: string;
}

export class ChildContentSummaryResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Section 1' })
  title: string;

  @ApiProperty({ example: 'section-1' })
  slug: string;

  @ApiPropertyOptional({ type: ParentSummary })
  parent?: ParentSummary;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
