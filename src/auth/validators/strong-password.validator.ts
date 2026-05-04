import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function StrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'StrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') return false;

          return (
            /[A-Z]/.test(value) && // uppercase
            /[a-z]/.test(value) && // lowercase
            /\d/.test(value) && // number
            /[^A-Za-z0-9]/.test(value) // special char
          );
        },

        defaultMessage(args: ValidationArguments) {
          const value = args.value as string;
          const errors: string[] = [];

          if (!/[A-Z]/.test(value))
            errors.push('at least one uppercase letter');

          if (!/[a-z]/.test(value))
            errors.push('at least one lowercase letter');

          if (!/\d/.test(value)) errors.push('at least one number');

          if (!/[^A-Za-z0-9]/.test(value))
            errors.push('at least one special character');

          return `Password must contain ${errors.join(', ')}!`;
        },
      },
    });
  };
}
