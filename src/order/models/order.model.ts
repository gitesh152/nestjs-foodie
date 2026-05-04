import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Country, OrderStatus } from '@prisma/client';
import { OrderItem } from './order-item.model';

@ObjectType('Order')
export class Order {
  @Field(() => ID)
  id: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Country)
  country: Country;

  @Field(() => [OrderItem])
  items: OrderItem[];

  @Field()
  totalAmount: number;
}
