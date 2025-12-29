import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';

@InputType()
export class CreateUserInput {
  @IsString()
  @IsEmail()
  @Field()
  email: string;

  @IsString()
  @Field()
  name: string;
}
