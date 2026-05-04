import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentInput } from './dtos/create-payment.input';
import type {
  PaymentMethod as PrismaPaymentMethod,
  Prisma,
} from '@prisma/client';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { UpdatePaymentInput } from './dtos/update-payment.input';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: JwtPayload,
    { cardLast4, brand }: CreatePaymentInput,
  ): Promise<PrismaPaymentMethod> {
    // Optional: We are already using RolesGuard
    // Only ADMIN allowed
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can create payment method');
    }
    return await this.prisma.paymentMethod.create({
      data: {
        userId: user.sub,
        cardLast4,
        brand,
      },
    });
  }

  // Get My Payment Methods
  async getMany(): Promise<PrismaPaymentMethod[]> {
    return await this.prisma.paymentMethod.findMany({});
  }

  // Update Payment Method (ADMIN only)
  async update(
    user: JwtPayload,
    { paymentMethodId, cardLast4, brand }: UpdatePaymentInput,
  ): Promise<PrismaPaymentMethod> {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can update payment method');
    }

    const payment = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!payment) {
      throw new NotFoundException('Payment method not found');
    }

    const data: Prisma.PaymentMethodUpdateInput = {};

    if (cardLast4 !== undefined) {
      data.cardLast4 = cardLast4;
    }

    if (brand !== undefined) {
      data.brand = brand;
    }

    // Optional: prevent empty update
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    return this.prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data,
    });
  }
}
