import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}

@ObjectType()
export class LogoutResponse {
  @Field()
  success: boolean;

  @Field()
  type: string;

  @Field({ nullable: true })
  message?: string;
}
