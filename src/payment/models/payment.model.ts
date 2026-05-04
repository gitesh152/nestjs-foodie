import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Payment {
  @Field(() => ID)
  id: string;

  @Field()
  cardLast4: string;

  @Field()
  brand: string;
}
