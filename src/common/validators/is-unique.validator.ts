import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { DataSource, Not, ObjectLiteral, EntityTarget } from 'typeorm';

@ValidatorConstraint({ name: 'isUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly dataSource: DataSource) {}

  async validate(value: unknown, args: ValidationArguments) {
    const [entityClass, excludeField] = args.constraints as [
      EntityTarget<ObjectLiteral>,
      string?,
    ];
    const property = args.property;
    const repository = this.dataSource.getRepository(entityClass);

    const query: ObjectLiteral = { [property]: value };

    if (excludeField && args.object) {
      // If we are updating and want to exclude the current record by ID (or other field)
      const obj = args.object as Record<string, unknown>;
      const excludeValue = obj[excludeField];
      if (excludeValue) {
        query[excludeField] = Not(excludeValue);
      }
    }

    const count = await repository.count({ where: query });
    return count === 0;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} is already taken`;
  }
}

export function IsUnique(
  entity: EntityTarget<ObjectLiteral>,
  excludeField?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entity, excludeField],
      validator: IsUniqueConstraint,
    });
  };
}
