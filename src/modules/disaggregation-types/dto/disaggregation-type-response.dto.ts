import { ApiProperty } from '@nestjs/swagger';
import { SupportedLocale } from '../../../common/types/i18n.type';

export class DisaggregationTypeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['en', 'ne'] })
  locale: SupportedLocale;

  @ApiProperty()
  isSelective: boolean;

  @ApiProperty({ required: false, nullable: true })
  sortOrder: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
