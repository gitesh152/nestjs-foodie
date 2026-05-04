import { Country, Role } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  name: string;
  email: string;
  role: Role;
  country: Country;
};
