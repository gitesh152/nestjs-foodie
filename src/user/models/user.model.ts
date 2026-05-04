import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Country, Role } from '@prisma/client';

@ObjectType('User')
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => Country)
  country: Country;

  @Field(() => Role)
  role: Role;
}
