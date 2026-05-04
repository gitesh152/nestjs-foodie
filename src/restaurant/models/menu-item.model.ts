import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MenuItem {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => ID)
  restaurantId: string;
}
