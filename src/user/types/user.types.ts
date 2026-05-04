import { Prisma, User as PrismaUser } from '@prisma/client';

export type UserAuthIdentity = Pick<
  PrismaUser,
  'id' | 'name' | 'email' | 'role' | 'country'
>;

export type UserPublicProfile = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    country: true;
    role: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

export type UserWithPasswordHash = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    password: true;
    country: true;
    role: true;
  };
}>;
