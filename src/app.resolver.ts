import { ConfigService } from '@nestjs/config';
import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  constructor(private readonly configService: ConfigService) {}

  @Query(() => String)
  health(): string {
    const nodeEnv = this.configService.getOrThrow<string>(
      'application.nodeEnv',
    );
    const port = this.configService.getOrThrow<number>('application.port');

    return `Server is running on port ${port} in ${nodeEnv} environment.`;
  }
}
