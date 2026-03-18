import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Type as TypeEntity } from './entities/type.entity';
import { TypeTranslation } from './entities/type-translation.entity';
import { TypesService } from './types.service';
import { TypesController } from './types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TypeEntity, TypeTranslation])],
  controllers: [TypesController],
  providers: [TypesService],
  exports: [TypesService],
})
export class TypesModule {}
