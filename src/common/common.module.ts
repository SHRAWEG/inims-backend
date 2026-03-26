import { Module } from '@nestjs/common';
import { IsUniqueConstraint } from './validators/is-unique.validator';
import { MatchConstraint } from './validators/match.validator';
import { IsAgeAtLeastConstraint } from './validators/is-age-at-least.validator';
import { IsAfterDateConstraint } from './validators/is-after-date.validator';
import { IsAllowedDomainConstraint } from './validators/is-allowed-domain.validator';
import { IsBeforeTodayConstraint } from './validators/is-before-today.validator';
import { IsGreaterThanConstraint } from './validators/is-greater-than.validator';
import { IsNotDisposableEmailConstraint } from './validators/is-not-disposable-email.validator';

/**
 * CommonModule — exports shared providers.
 * Registered custom class-validators as providers to enable NestJS DI.
 */
@Module({
  imports: [],
  providers: [
    IsUniqueConstraint,
    MatchConstraint,
    IsAgeAtLeastConstraint,
    IsAfterDateConstraint,
    IsAllowedDomainConstraint,
    IsBeforeTodayConstraint,
    IsGreaterThanConstraint,
    IsNotDisposableEmailConstraint,
  ],
  exports: [
    IsUniqueConstraint,
    MatchConstraint,
    IsAgeAtLeastConstraint,
    IsAfterDateConstraint,
    IsAllowedDomainConstraint,
    IsBeforeTodayConstraint,
    IsGreaterThanConstraint,
    IsNotDisposableEmailConstraint,
  ],
})
export class CommonModule {}
