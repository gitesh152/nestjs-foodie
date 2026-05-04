import { Field, InputType } from '@nestjs/graphql';
import { Country } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @Field(() => Country, { nullable: true })
  @IsOptional()
  @IsEnum(Country)
  country?: Country;
}
