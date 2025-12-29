import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.user.findMany({
      include: {
        posts: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        posts: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async createUser(createUserInput: CreateUserInput) {
    const { email, name } = createUserInput;
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
      },
    });

    return user;
  }

  async updateUser(id: string, updateUserInput: UpdateUserInput) {
    // Check if user exists
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: updateUserInput,
      include: {
        posts: true,
      },
    });

    return user;
  }

  async deleteUser(id: string) {
    // Check if user exists
    await this.findOne(id);

    const user = await this.prisma.user.delete({
      where: {
        id,
      },
    });

    return user;
  }
}
