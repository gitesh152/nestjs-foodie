import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsUUID } from 'class-validator';

@InputType()
export class AddItemInput {
  @Field(() => ID)
  @IsUUID()
  orderId: string;

  @Field(() => ID)
  @IsUUID()
  menuItemId: string;

  @Field(() => Int)
  @IsInt()
  quantity: number;
}
