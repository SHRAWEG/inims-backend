import { ApiProperty } from '@nestjs/swagger';
import { SupportedLocale } from '../../../common/types/i18n.type';

export class DisaggregationConfigResponseDto {
  @ApiProperty()
  disaggregationTypeId: string;

  @ApiProperty()
  disaggregationTypeName: string;

  @ApiProperty({ required: false, type: [String] })
  optionIds?: string[];
}

export class MsnpIndicatorConfigurationResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'uuid-string' })
  indicatorId: string;

  @ApiProperty({ example: 'uuid-string', required: false })
  sectorId: string | null;

  @ApiProperty({ example: 'uuid-string', required: false })
  typeId: string | null;

  @ApiProperty({ example: 'uuid-string', required: false })
  roleId: string | null;

  @ApiProperty({ required: false, example: 'percentage' })
  unit: string | null;

  @ApiProperty()
  indicatorName: string;

  @ApiProperty({ required: false })
  sectorName?: string;

  @ApiProperty({ required: false })
  typeName?: string;

  @ApiProperty({ required: false })
  roleName?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ enum: ['en', 'ne'] })
  locale: SupportedLocale;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [DisaggregationConfigResponseDto], required: false })
  disaggregations?: DisaggregationConfigResponseDto[];
}
