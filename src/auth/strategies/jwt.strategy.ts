import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>(
        'application.accessTokenSecret',
      ),
    });
  }

  validate(payload: JwtPayload) {
    // Returns the JWT payload as-is (stateless validation).
    //
    // NOTE: All user data (role, country, etc.) is embedded in the token at
    // creation time and is NOT refreshed from the database per request.
    // If user data changes in the database, the user must obtain fresh tokens
    // via the refresh endpoint or login endpoint.
    return payload;
  }
}
