import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isAllowedDomain' })
@Injectable()
export class IsAllowedDomainConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const [allowedDomains] = args.constraints as [string[]];
    if (typeof value !== 'string') return false;
    const domain = value.split('@')[1];
    if (!domain) return false;
    return allowedDomains.some(
      (d: string) => domain.toLowerCase() === d.toLowerCase(),
    );
  }

  defaultMessage(args: ValidationArguments) {
    const [allowedDomains] = args.constraints as [string[]];
    return `${args.property} must be from one of the allowed domains: ${allowedDomains.join(', ')}`;
  }
}

export function IsAllowedDomain(
  allowedDomains: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [allowedDomains],
      validator: IsAllowedDomainConstraint,
    });
  };
}
