import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gender } from './entities/gender.entity';
import { GenderTranslation } from './entities/gender-translation.entity';
import { GendersService } from './genders.service';
import { GendersController } from './genders.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gender, GenderTranslation]),
    AuditLogModule,
  ],
  controllers: [GendersController],
  providers: [GendersService],
  exports: [GendersService],
})
export class GendersModule {}
