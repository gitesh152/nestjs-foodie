import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { AddItemInput } from './dtos/add-item.input';
import { Country, Order as PrismaOrder } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private validateOrderAccess(user: JwtPayload, order: PrismaOrder) {
    // MEMBER → only own orders
    if (user.role === 'MEMBER' && order.userId !== user.sub) {
      throw new ForbiddenException('Members can only access their own orders');
    }

    // MANAGER → only same country
    if (user.role === 'MANAGER' && order.country !== user.country) {
      throw new ForbiddenException(
        'Managers can only access orders from their country',
      );
    }

    // ADMIN → full access
  }

  // Create Order
  async createOrder(user: JwtPayload, country?: Country) {
    const orderCountry = user.role === 'ADMIN' ? country : user.country;

    if (user.role === 'ADMIN' && !country) {
      throw new BadRequestException('Admin must provide country for the order');
    }

    return this.prisma.order.create({
      data: {
        userId: user.sub,
        country: orderCountry!,
        totalAmount: 0,
      },
    });
  }

  // Add Item
  async addItem(
    user: JwtPayload,
    { orderId, menuItemId, quantity }: AddItemInput,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    this.validateOrderAccess(user, order);

    if (order.status !== 'PENDING') {
      throw new ForbiddenException('Cannot modify finalized order');
    }

    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    await this.prisma.orderItem.create({
      data: {
        orderId,
        menuItemId,
        quantity,
      },
    });

    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: { menuItem: true },
    });

    const total = items.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0,
    );

    return this.prisma.order.update({
      where: { id: orderId },
      data: { totalAmount: total },
      include: { items: true },
    });
  }

  // Checkout Order
  async checkoutOrder(
    user: JwtPayload,
    orderId: string,
    paymentMethodId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    this.validateOrderAccess(user, order);

    if (order.status !== 'PENDING') {
      throw new ForbiddenException('Order already processed');
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentMethodId,
      },
      include: { items: true },
    });
  }

  // Cancel Order
  async cancelOrder(user: JwtPayload, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    this.validateOrderAccess(user, order);

    if (order.status !== 'PENDING') {
      throw new ForbiddenException(
        `Cannot cancel order with status ${order.status}`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
      },
      include: { items: true },
    });
  }
}
