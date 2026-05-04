import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const pgPool = new Pool({
      connectionString: configService.getOrThrow<string>('database.url'),
      ssl: {
        rejectUnauthorized: true,
      },
    });

    const adapter = new PrismaPg(pgPool);

    super({ adapter });
  }

  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    await this.$connect();
    this.logger.verbose(`✅ Database connected.`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.verbose(`⏬ Database disconnected!`);
  }
}
