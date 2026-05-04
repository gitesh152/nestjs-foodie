import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Country, Prisma, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UserPublicProfile, UserWithPasswordHash } from './types/user.types';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    email: string;
    password: string;
    country: Country;
    role?: Role;
  }): Promise<UserPublicProfile> {
    try {
      return await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          country: data.country,
          role: data.role || Role.MEMBER,
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }

      // ❗ fallback
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserWithPasswordHash | null> {
    return await this.prisma.user.findUnique({
      where: {
        email,
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
  }

  async findById(id: string): Promise<UserPublicProfile | null> {
    return await this.prisma.user.findUnique({
      where: {
        id,
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
  }

  async getById(id: string): Promise<UserPublicProfile> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID: ${id} could not be found`);
    }
    return user;
  }
}
