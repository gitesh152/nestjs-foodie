import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Payment } from './models/payment.model';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { PaymentService } from './payment.service';
import { CreatePaymentInput } from './dtos/create-payment.input';
import { UpdatePaymentInput } from './dtos/update-payment.input';

@Resolver()
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  // Get My Payments (ALL users)
  @UseGuards(JwtAuthGuard)
  @Query(() => [Payment])
  async paymentMethods() {
    return await this.paymentService.getMany();
  }

  // Create Payment (ADMIN only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Payment)
  async createPayment(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CreatePaymentInput,
  ) {
    return await this.paymentService.create(user, input);
  }

  // Update Payment (ADMIN only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => Payment)
  async updatePayment(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: UpdatePaymentInput,
  ) {
    return await this.paymentService.update(user, input);
  }
}
