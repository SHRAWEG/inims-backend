import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReorderDisaggregationTypesDto {
  @ApiProperty({
    type: [String],
    description: 'Array of ordered Disaggregation Type IDs',
  })
  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
