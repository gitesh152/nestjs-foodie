import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Country } from '@prisma/client';
import { StrongPassword } from '../validators/strong-password.validator';

@InputType()
export class AuthSignupInput {
  @Field()
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @Field()
  @MinLength(4)
  @IsString()
  name: string;

  @Field()
  @IsString()
  @StrongPassword()
  password: string;

  @Field(() => Country)
  @IsEnum(Country)
  country: Country;
}
