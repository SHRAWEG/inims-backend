import { PartialType } from '@nestjs/swagger';
import { CreateChildContentDto } from './create-child-content.dto';

export class UpdateChildContentDto extends PartialType(CreateChildContentDto) {}
