import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildContent } from './entities/child-content.entity';
import { Content } from '../contents/entities/content.entity';
import { ChildContentsService } from './child-contents.service';
import { ChildContentsController } from './child-contents.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChildContent, Content])],
  controllers: [ChildContentsController],
  providers: [ChildContentsService],
  exports: [ChildContentsService],
})
export class ChildContentsModule {}
