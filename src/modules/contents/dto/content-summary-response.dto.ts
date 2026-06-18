import { ApiProperty } from '@nestjs/swagger';

export class ContentSummaryResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'About Us' })
  title: string;

  @ApiProperty({ example: 'about-us' })
  slug: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
