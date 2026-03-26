import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isBeforeToday' })
@Injectable()
export class IsBeforeTodayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!value) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(value as string | number | Date) < today;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be in the past`;
  }
}

export function IsBeforeToday(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBeforeTodayConstraint,
    });
  };
}
