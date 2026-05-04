import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthSignupInput } from './dtos/auth-signup.input';
import { AuthLoginInput } from './dtos/auth-login.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponse, LogoutResponse } from './models/auth.model';
import { User } from '../user/models/user.model';
import type { JwtPayload } from './types/jwt-payload.type';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @Mutation(() => AuthResponse)
  async signup(@Args('input') input: AuthSignupInput) {
    return this.authService.signup(input);
  }

  @Mutation(() => AuthResponse)
  async login(@Args('input') input: AuthLoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => AuthResponse)
  async refresh(@Args('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Mutation(() => LogoutResponse)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: JwtPayload,
    @Args('refreshToken') refreshToken: string,
  ) {
    const success = await this.authService.logout(refreshToken, user.sub);
    return {
      success: true,
      type: 'SINGLE',
      message: success
        ? 'Logged out successfully from this device'
        : 'Session ended',
    };
  }

  @Mutation(() => LogoutResponse)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: JwtPayload) {
    await this.authService.logoutAll(user.sub);
    return {
      success: true,
      type: 'ALL',
      message: 'Logged out from all devices',
    };
  }
}
