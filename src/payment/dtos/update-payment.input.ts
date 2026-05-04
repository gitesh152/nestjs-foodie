import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, Matches, Length } from 'class-validator';

@InputType()
export class UpdatePaymentInput {
  @Field()
  @IsUUID()
  paymentMethodId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(4, 4, { message: 'cardLast4 must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'cardLast4 must contain only digits' })
  cardLast4?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  brand?: string;
}
