/* eslint-disable @typescript-eslint/unbound-method */

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Country, Prisma, Role, User as PrismaUser } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '../prisma/prisma.service';
import { UserPublicProfile, UserWithPasswordHash } from './types/user.types';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: DeepMockProxy<PrismaService>;

  const createPrismaUser = (
    overrides: Partial<PrismaUser> = {},
  ): PrismaUser => ({
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    country: Country.INDIA,
    role: Role.MEMBER,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createUserPublicProfile = (
    overrides: Partial<UserPublicProfile> = {},
  ): PrismaUser => createPrismaUser(overrides);

  const createUserWithPasswordHash = (
    overrides: Partial<UserWithPasswordHash> = {},
  ): PrismaUser => createPrismaUser(overrides);

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  describe('create', () => {
    it('creates a user with default member role when role is not provided', async () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed',
        country: Country.INDIA,
      };
      const createdUser = createUserPublicProfile({
        name: input.name,
        email: input.email,
      });

      prisma.user.create.mockResolvedValue(createdUser);

      const result = await service.create(input);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          email: input.email,
          password: input.password,
          country: input.country,
          role: Role.MEMBER,
        },
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(createdUser);
    });

    it('creates a user with explicit role when provided', async () => {
      const input = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashed',
        country: Country.AMERICA,
        role: Role.ADMIN,
      };
      const createdUser = createUserPublicProfile({
        name: input.name,
        email: input.email,
        country: input.country,
        role: input.role,
      });

      prisma.user.create.mockResolvedValue(createdUser);

      await service.create(input);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          email: input.email,
          password: input.password,
          country: input.country,
          role: Role.ADMIN,
        },
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('throws conflict exception when email already exists', async () => {
      const knownError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        {
          code: 'P2002',
          clientVersion: 'test',
        },
      );

      prisma.user.create.mockRejectedValue(knownError);

      await expect(
        service.create({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed',
          country: Country.INDIA,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows non-unique prisma errors', async () => {
      const knownError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key violation',
        {
          code: 'P2003',
          clientVersion: 'test',
        },
      );

      prisma.user.create.mockRejectedValue(knownError);

      await expect(
        service.create({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed',
          country: Country.INDIA,
        }),
      ).rejects.toBe(knownError);
    });
  });

  describe('findByEmail', () => {
    it('returns user with password hash by email', async () => {
      const foundUser = createUserWithPasswordHash();
      prisma.user.findUnique.mockResolvedValue(foundUser);

      const result = await service.findByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          country: true,
          role: true,
        },
      });
      expect(result).toEqual(foundUser);
    });

    it('returns null when no user exists with the email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns public user by id', async () => {
      const foundUser = createUserPublicProfile();
      prisma.user.findUnique.mockResolvedValue(foundUser);

      const result = await service.findById('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
        },
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(foundUser);
    });

    it('returns null when user id does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('missing-user-id');

      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('returns the user when found', async () => {
      const foundUser = createUserPublicProfile({ id: 'found-user' });
      prisma.user.findUnique.mockResolvedValue(foundUser);

      const result = await service.getById('found-user');

      expect(result).toEqual(foundUser);
    });

    it('throws not found exception when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing-user')).rejects.toThrow(
        new NotFoundException('User with ID: missing-user could not be found'),
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
