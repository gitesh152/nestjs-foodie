import { registerAs } from '@nestjs/config';

export const applicationConfig = registerAs('application', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: Number.parseInt(process.env.PORT ?? '3000', 10),

  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,

  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
}));
