import { Module } from '@nestjs/common';

/**
 * CommonModule — exports shared providers.
 * Currently empty since all shared code is utility-based (no injectable providers yet).
 * The audit module is registered separately as @Global().
 */
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class CommonModule {}
