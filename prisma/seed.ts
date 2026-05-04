import { Pool } from 'pg';
import { Country, PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { InternalServerErrorException } from '@nestjs/common';

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
  },
});

const adapter = new PrismaPg(pgPool);

const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  if (!DEFAULT_PASSWORD) {
    throw new InternalServerErrorException(
      `Please provide Default password for seed.`,
    );
  }

  const password = await hashPassword(DEFAULT_PASSWORD);

  // ADMIN
  await prisma.user.upsert({
    where: { email: 'admin@foodie.com' },
    update: {},
    create: {
      name: 'Nick Fury',
      email: 'admin@foodie.com',
      password,
      role: Role.ADMIN,
      country: Country.INDIA,
    },
  });

  // MANAGERS
  await prisma.user.upsert({
    where: { email: 'india.manager@foodie.com' },
    update: {},
    create: {
      name: 'Captain Marvel',
      email: 'india.manager@foodie.com',
      password,
      role: Role.MANAGER,
      country: Country.INDIA,
    },
  });

  await prisma.user.upsert({
    where: { email: 'usa.manager@foodie.com' },
    update: {},
    create: {
      name: 'Captain America',
      email: 'usa.manager@foodie.com',
      password,
      role: Role.MANAGER,
      country: Country.AMERICA,
    },
  });

  // TEAM MEMBERS
  await prisma.user.createMany({
    data: [
      {
        name: 'Thanos',
        email: 'thanos@foodie.com',
        password,
        role: Role.MEMBER,
        country: Country.INDIA,
      },
      {
        name: 'Thor',
        email: 'thor@foodie.com',
        password,
        role: Role.MEMBER,
        country: Country.INDIA,
      },
      {
        name: 'Travis',
        email: 'travis@foodie.com',
        password,
        role: Role.MEMBER,
        country: Country.AMERICA,
      },
    ],
    skipDuplicates: true,
  });

  // INDIA RESTAURANTS
  await prisma.restaurant.create({
    data: {
      name: 'Delhi Bites',
      country: Country.INDIA,
      menuItems: {
        create: [
          { name: 'Paneer Butter Masala', price: 250 },
          { name: 'Butter Naan', price: 40 },
          { name: 'Biryani', price: 200 },
        ],
      },
    },
  });

  // AMERICA RESTAURANTS
  await prisma.restaurant.create({
    data: {
      name: 'NYC Burgers',
      country: Country.AMERICA,
      menuItems: {
        create: [
          { name: 'Cheese Burger', price: 8 },
          { name: 'Fries', price: 3 },
          { name: 'Coke', price: 2 },
        ],
      },
    },
  });

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
