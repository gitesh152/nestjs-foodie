import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Country } from '@prisma/client';
import { MenuItem } from './menu-item.model';

@ObjectType()
export class Restaurant {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Country)
  country: Country;

  @Field(() => [MenuItem])
  menuItems: MenuItem[];
}
