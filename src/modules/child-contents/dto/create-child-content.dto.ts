import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChildContentDto {
  @ApiProperty({ example: 'Section 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'section-1' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: '<h2>Section 1</h2><p>Content...</p>' })
  @IsString()
  @IsNotEmpty()
  htmlContent: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  parent?: string;
}
