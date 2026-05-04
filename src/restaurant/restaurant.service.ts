import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all restaurants (with country restriction)
  async findManyByCountry(user: JwtPayload) {
    return this.prisma.restaurant.findMany({
      where: {
        // BONUS: country restriction
        ...(user.role !== 'ADMIN' && { country: user.country }),
      },
      include: {
        menuItems: true,
      },
    });
  }

  // Get menu by restaurant
  async findMenuByRestaurant(restaurantId: string, user: JwtPayload) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { menuItems: true },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    // BONUS: country restriction
    if (user.role !== 'ADMIN' && user.country !== restaurant.country) {
      throw new ForbiddenException('Access denied for this country');
    }

    return restaurant.menuItems;
  }
}
