import { Injectable, UnauthorizedException } from '@nestjs/common';
import ms, { StringValue } from 'ms';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthSignupInput } from './dtos/auth-signup.input';
import { comparePassword, hashPassword, hashToken } from './auth.helpers';
import { AuthLoginInput } from './dtos/auth-login.input';
import { JwtPayload } from './types/jwt-payload.type';
import { UserAuthIdentity } from '../user/types/user.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: StringValue;
  private readonly refreshTokenExpiry: StringValue;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenSecret = this.configService.getOrThrow(
      'application.accessTokenSecret',
    );
    this.refreshTokenSecret = this.configService.getOrThrow(
      'application.refreshTokenSecret',
    );
    this.accessTokenExpiry = this.configService.getOrThrow(
      'application.accessTokenExpiry',
    );
    this.refreshTokenExpiry = this.configService.getOrThrow(
      'application.refreshTokenExpiry',
    );
  }

  async signup(input: AuthSignupInput) {
    const hashedPassword = await hashPassword(input.password);

    const user = await this.userService.create({
      ...input,
      password: hashedPassword,
    });

    return this.issueTokens(user);
  }

  async login({ email, password }: AuthLoginInput) {
    const user = await this.userService.findByEmail(email);

    if (!user || !(await comparePassword(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async getMe(userId: string) {
    return this.userService.getById(userId);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = hashToken(refreshToken);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.refreshToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          revoked: true,
          expiresAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              country: true,
            },
          },
        },
      });

      // Reuse attack
      if (!existing) {
        await tx.refreshToken.updateMany({
          where: { userId: payload.sub, revoked: null },
          data: { revoked: new Date() },
        });

        throw new UnauthorizedException('Invalid refresh token');
      }

      if (
        existing.revoked ||
        (existing.expiresAt && existing.expiresAt < new Date())
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Atomic revoke
      const revoke = await tx.refreshToken.updateMany({
        where: { tokenHash, revoked: null },
        data: { revoked: new Date() },
      });

      if (revoke.count === 0) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.issueTokens(existing.user, tx);

      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          replacedByHash: hashToken(tokens.refreshToken),
        },
      });

      await this.cleanupUserTokens(existing.user.id, tx);

      return tokens;
    });
  }

  async logout(refreshToken: string, userId: string) {
    const tokenHash = hashToken(refreshToken);

    const result = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revoked: null },
      data: { revoked: new Date() },
    });

    return result.count > 0;
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: null },
      data: { revoked: new Date() },
    });

    return true;
  }

  // CENTRALIZED TOKEN ISSUER
  private async issueTokens(
    user: UserAuthIdentity,
    tx: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      country: user.country,
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);
    const tokenHash = hashToken(refreshToken);

    await tx.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + ms(this.refreshTokenExpiry)),
      },
    });

    await this.cleanupUserTokens(user.id, tx);

    return { accessToken, refreshToken };
  }

  private async cleanupUserTokens(
    userId: string,
    tx: PrismaService | Prisma.TransactionClient,
  ) {
    await tx.refreshToken.deleteMany({
      where: {
        userId,
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            revoked: { not: null },
            createdAt: {
              lt: new Date(Date.now() - ms(this.refreshTokenExpiry)),
            },
          },
        ],
      },
    });
  }

  private signAccessToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiry,
    });
  }

  private signRefreshToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiry,
    });
  }
}
