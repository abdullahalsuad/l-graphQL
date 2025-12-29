import { ObjectType, Field } from '@nestjs/graphql';
import { Post } from './post.model';

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => [Post], { nullable: true })
  posts?: Post[];
}
