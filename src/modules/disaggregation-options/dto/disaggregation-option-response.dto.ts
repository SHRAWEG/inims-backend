import { ApiProperty } from '@nestjs/swagger';
import { SupportedLocale } from '../../../common/types/i18n.type';

export class DisaggregationOptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  disaggregationTypeId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['en', 'ne'] })
  locale: SupportedLocale;

  @ApiProperty({ required: false, nullable: true })
  code: string | null;

  @ApiProperty({ required: false, nullable: true })
  sortOrder: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
