import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isNotDisposableEmail' })
@Injectable()
export class IsNotDisposableEmailConstraint implements ValidatorConstraintInterface {
  private readonly disposableDomains = [
    'mailinator.com',
    'tempmail.com',
    'guerrillamail.com',
    'throwawaymail.com',
    '10minutemail.com',
    'temp-mail.org',
  ];

  validate(value: any) {
    if (typeof value !== 'string') return false;
    const domain = value.split('@')[1];
    if (!domain) return false;
    return !this.disposableDomains.some((d) =>
      domain.toLowerCase().includes(d),
    );
  }

  defaultMessage() {
    return `Disposable email addresses are not allowed`;
  }
}

export function IsNotDisposableEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotDisposableEmailConstraint,
    });
  };
}
