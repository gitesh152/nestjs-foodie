import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { registerEnums } from './common/graphql/enums';

async function bootstrap() {
  registerEnums();

  const logger = new Logger('bootstrap');

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const nodeEnv = configService.getOrThrow<string>('application.nodeEnv');

  const port = configService.getOrThrow<number>('application.port');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(port);

  logger.verbose(
    `Server is running on port ${port} in ${nodeEnv} environment.`,
  );
}
void bootstrap(); // NOSONAR
