import { Args, Query, Resolver } from '@nestjs/graphql';
import { RestaurantService } from './restaurant.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Restaurant } from './models/restaurant.model';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { MenuItem } from './models/menu-item.model';

@Resolver()
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  // View restaurants (ALL roles)
  @UseGuards(JwtAuthGuard)
  @Query(() => [Restaurant])
  async restaurants(@CurrentUser() user: JwtPayload) {
    return await this.restaurantService.findManyByCountry(user);
  }

  // View menu items
  @UseGuards(JwtAuthGuard)
  @Query(() => [MenuItem])
  menu(
    @Args('restaurantId') restaurantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.restaurantService.findMenuByRestaurant(restaurantId, user);
  }
}
