import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReorderDisaggregationOptionsDto {
  @ApiProperty({
    type: [String],
    description: 'Array of ordered Disaggregation Option IDs',
  })
  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
