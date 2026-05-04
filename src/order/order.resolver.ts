import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { OrderService } from './order.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Order } from './models/order.model';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { AddItemInput } from './dtos/add-item.input';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CheckoutOrderInput } from './dtos/checkout-order.input';
import { CreateOrderInput } from './dtos/create-order.input';

@Resolver()
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  // Create Order (ALL)
  @Mutation(() => Order)
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CreateOrderInput,
  ) {
    return this.orderService.createOrder(user, input.country);
  }

  // Add Item
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Order)
  async addItem(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: AddItemInput,
  ) {
    return await this.orderService.addItem(user, input);
  }
  // Checkout (ADMIN + MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Mutation(() => Order)
  async checkoutOrder(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CheckoutOrderInput,
  ) {
    return await this.orderService.checkoutOrder(
      user,
      input.orderId,
      input.paymentMethodId,
    );
  }

  // Cancel (ADMIN + MANAGER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Mutation(() => Order)
  cancelOrder(
    @CurrentUser() user: JwtPayload,
    @Args('orderId') orderId: string,
  ) {
    return this.orderService.cancelOrder(user, orderId);
  }
}
