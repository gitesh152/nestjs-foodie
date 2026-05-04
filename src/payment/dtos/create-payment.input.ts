import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

@InputType()
export class CreatePaymentInput {
  @Field()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'cardLast4 must be exactly 4 digits' })
  cardLast4: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  brand: string;
}
