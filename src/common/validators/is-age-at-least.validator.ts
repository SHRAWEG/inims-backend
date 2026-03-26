import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isAgeAtLeast' })
@Injectable()
export class IsAgeAtLeastConstraint implements ValidatorConstraintInterface {
  validate(value: string | number | Date, args: ValidationArguments) {
    const [minAge] = args.constraints as [number];
    if (!value) return true;

    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= minAge;
  }

  defaultMessage(args: ValidationArguments) {
    const [minAge] = args.constraints as [number];
    return `${args.property} must be at least ${minAge} years old`;
  }
}

export function IsAgeAtLeast(
  minAge: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minAge],
      validator: IsAgeAtLeastConstraint,
    });
  };
}
