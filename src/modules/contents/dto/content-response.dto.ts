import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContentChildSummary {
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

export class ContentResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'About Us' })
  title: string;

  @ApiProperty({ example: 'about-us' })
  slug: string;

  @ApiProperty({ example: '<h1>About Us</h1><p>Content here...</p>' })
  htmlContent: string;

  @ApiPropertyOptional({ type: [ContentChildSummary] })
  children?: ContentChildSummary[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
