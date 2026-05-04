import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('OrderItem')
export class OrderItem {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  quantity: number;

  @Field()
  menuItemId: string;
}
