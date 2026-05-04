/* eslint-disable @typescript-eslint/unbound-method */

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Country, RefreshToken, Role } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '../prisma/prisma.service';
import {
  UserAuthIdentity,
  UserPublicProfile,
  UserWithPasswordHash,
} from '../user/types/user.types';
import { UserService } from '../user/user.service';
import { comparePassword, hashPassword, hashToken } from './auth.helpers';
import { AuthService } from './auth.service';

jest.mock('./auth.helpers', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  hashToken: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: DeepMockProxy<UserService>;
  let jwtService: DeepMockProxy<JwtService>;
  let prisma: DeepMockProxy<PrismaService>;
  let configService: DeepMockProxy<ConfigService>;

  const mockedHashPassword = hashPassword as jest.MockedFunction<
    typeof hashPassword
  >;
  const mockedComparePassword = comparePassword as jest.MockedFunction<
    typeof comparePassword
  >;
  const mockedHashToken = hashToken as jest.MockedFunction<typeof hashToken>;

  const createAuthUser = (
    overrides: Partial<UserAuthIdentity> = {},
  ): UserAuthIdentity => ({
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: Role.MEMBER,
    country: Country.INDIA,
    ...overrides,
  });

  const createPublicUser = (
    overrides: Partial<UserPublicProfile> = {},
  ): UserPublicProfile => ({
    ...createAuthUser(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createUserWithPassword = (
    overrides: Partial<UserWithPasswordHash> = {},
  ): UserWithPasswordHash => ({
    ...createAuthUser(),
    password: 'hashed',
    ...overrides,
  });

  const createRefreshToken = (
    overrides: Partial<RefreshToken> = {},
  ): RefreshToken => ({
    id: 'rt-1',
    tokenHash: 'token-hash',
    replacedByHash: null,
    revoked: null,
    expiresAt: new Date(Date.now() + 1000 * 60),
    userId: 'user-1',
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    userService = mockDeep<UserService>();
    jwtService = mockDeep<JwtService>();
    prisma = mockDeep<PrismaService>();
    configService = mockDeep<ConfigService>();

    configService.getOrThrow.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        'application.accessTokenSecret': 'access-secret',
        'application.refreshTokenSecret': 'refresh-secret',
        'application.accessTokenExpiry': '15m',
        'application.refreshTokenExpiry': '7d',
      };

      return values[key];
    });

    prisma.refreshToken.create.mockResolvedValue(createRefreshToken());
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('signup', () => {
    it('hashes password, creates user, and issues tokens', async () => {
      const input = {
        name: 'John',
        email: 'john@example.com',
        password: 'PlainPass1!',
        country: Country.INDIA,
      };

      mockedHashPassword.mockResolvedValue('hashed-password');
      userService.create.mockResolvedValue(createPublicUser({ name: 'John' }));
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      mockedHashToken.mockReturnValue('token-hash');

      const result = await service.signup(input);

      expect(mockedHashPassword).toHaveBeenCalledWith('PlainPass1!');
      expect(userService.create).toHaveBeenCalledWith({
        ...input,
        password: 'hashed-password',
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('login', () => {
    it('throws unauthorized when user is missing', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'secret' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws unauthorized when password is invalid', async () => {
      userService.findByEmail.mockResolvedValue(createUserWithPassword());
      mockedComparePassword.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens for valid credentials', async () => {
      userService.findByEmail.mockResolvedValue(createUserWithPassword());
      mockedComparePassword.mockResolvedValue(true);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      mockedHashToken.mockReturnValue('token-hash');

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct',
      });

      expect(mockedComparePassword).toHaveBeenCalledWith('correct', 'hashed');
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('getMe', () => {
    it('returns the current user profile', async () => {
      const me = createPublicUser();
      userService.getById.mockResolvedValue(me);

      const result = await service.getMe('user-1');

      expect(userService.getById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(me);
    });
  });

  describe('refresh', () => {
    it('throws unauthorized for invalid refresh token signature', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('returns true when a token is revoked', async () => {
      mockedHashToken.mockReturnValue('hashed-token');
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('refresh-token', 'user-1');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: 'hashed-token',
          userId: 'user-1',
          revoked: null,
        },
        data: { revoked: expect.any(Date) as Date },
      });
      expect(result).toBe(true);
    });

    it('returns false when no token is revoked', async () => {
      mockedHashToken.mockReturnValue('hashed-token');
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.logout('refresh-token', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('logoutAll', () => {
    it('revokes all active tokens and returns true', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.logoutAll('user-1');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          revoked: null,
        },
        data: { revoked: expect.any(Date) as Date },
      });
      expect(result).toBe(true);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
