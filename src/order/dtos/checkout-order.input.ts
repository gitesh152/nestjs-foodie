import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CheckoutOrderInput {
  @Field(() => ID)
  @IsUUID()
  orderId: string;

  @Field(() => ID)
  @IsUUID()
  paymentMethodId: string;
}
