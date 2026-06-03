import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

export class QueryMsnpIndicatorDataDto extends LocaleQueryDto {
  @ApiProperty({ description: 'Filter by fiscal year ID', required: true })
  @IsUUID('4')
  @IsNotEmpty()
  fiscalYearId: string;
}
