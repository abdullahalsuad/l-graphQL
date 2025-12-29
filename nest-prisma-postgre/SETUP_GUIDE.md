# Complete Guide: Setting Up NestJS + GraphQL + Prisma + PostgreSQL

This is a comprehensive, step-by-step guide to create a production-ready NestJS backend with GraphQL API and Prisma ORM from scratch.

## 📚 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Initialization](#project-initialization)
3. [Installing Dependencies](#installing-dependencies)
4. [Database Setup](#database-setup)
5. [Prisma Configuration](#prisma-configuration)
6. [GraphQL Setup](#graphql-setup)
7. [Creating Your First Module](#creating-your-first-module)
8. [Testing the API](#testing-the-api)
9. [Additional Configuration](#additional-configuration)
10. [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

Install these before starting:

1. **Node.js** (v18 or higher)

   ```bash
   # Download from: https://nodejs.org/
   # Verify installation:
   node --version
   ```

2. **pnpm** (recommended) or npm/yarn

   ```bash
   # Install pnpm globally:
   npm install -g pnpm

   # Verify:
   pnpm --version
   ```

3. **PostgreSQL** (v14 or higher)

   ```bash
   # Download from: https://www.postgresql.org/download/
   # Or use Docker (recommended):
   docker --version
   ```

4. **Git**
   ```bash
   git --version
   ```

---

## Project Initialization

### Step 1: Create New NestJS Project

```bash
# Install NestJS CLI globally
npm install -g @nestjs/cli

# Verify installation
nest --version

# Create new project
nest new my-project-name

# When prompted, choose your package manager:
# ? Which package manager would you ❤️ to use?
# Select: pnpm (or npm/yarn)

# Navigate to project
cd my-project-name
```

### Step 2: Verify Initial Setup

```bash
# Start the development server
pnpm start:dev

# Visit: http://localhost:3000
# You should see "Hello World!"
```

Press `Ctrl+C` to stop the server.

---

## Installing Dependencies

### Step 3: Install Core Dependencies

```bash
# GraphQL dependencies
pnpm add @nestjs/graphql @nestjs/apollo @apollo/server graphql

# Prisma dependencies
pnpm add @prisma/client @prisma/adapter-pg pg
pnpm add -D prisma @types/pg

# Configuration
pnpm add @nestjs/config dotenv

# Validation
pnpm add class-validator class-transformer

# Security (for password hashing, etc.)
pnpm add bcrypt
pnpm add -D @types/bcrypt
```

### Step 4: Install Additional Tools (Optional but Recommended)

```bash
# Swagger for REST API documentation
pnpm add @nestjs/swagger

# For Express 5 integration with Apollo
pnpm add @as-integrations/express5
```

---

## Database Setup

### Step 5: Setup PostgreSQL Database

#### Option A: Using Docker (Recommended)

Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: my-project-db
    restart: always
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: mydb
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start the database:

```bash
# Start PostgreSQL
docker-compose up -d

# Check if running
docker ps

# View logs
docker-compose logs -f postgres
```

#### Option B: Using Local PostgreSQL

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mydb;

# Create user
CREATE USER myuser WITH PASSWORD 'mypassword';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;

# Exit
\q
```

### Step 6: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb?schema=public"

# Server
PORT=3000
NODE_ENV=development

# GraphQL
GRAPHQL_PLAYGROUND=true
GRAPHQL_DEBUG=true
```

Create a `.env.example` file (template for other developers):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
PORT=3000
NODE_ENV=development
GRAPHQL_PLAYGROUND=true
GRAPHQL_DEBUG=true
```

Update `.gitignore` to exclude `.env`:

```gitignore
# Add this line if not already present
.env
```

---

## Prisma Configuration

### Step 7: Initialize Prisma

```bash
# Initialize Prisma
pnpm prisma init

# This creates:
# - prisma/schema.prisma
# - .env file (if it doesn't exist)
```

### Step 8: Configure Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
generator client {
  provider   = "prisma-client-js"
  engineType = "library"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Example models
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

### Step 9: Create and Run Migrations

```bash
# Create initial migration
pnpm prisma migrate dev --name init

# This will:
# 1. Create migration files
# 2. Apply migrations to database
# 3. Generate Prisma Client

# Open Prisma Studio to view your database
pnpm prisma studio
# Visit: http://localhost:5555
```

### Step 10: Create Prisma Service

Create `src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Create `src/prisma/prisma.module.ts`:

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## GraphQL Setup

### Step 11: Configure GraphQL Module

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.GRAPHQL_PLAYGROUND === 'true',
      debug: process.env.GRAPHQL_DEBUG === 'true',
      context: ({ req, res }) => ({ req, res }),
    }),

    // Prisma
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Step 12: Update Main.ts for Production

Update `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server is running on: http://localhost:${port}`);
  console.log(`🎮 GraphQL Playground: http://localhost:${port}/graphql`);
}
bootstrap();
```

---

## Creating Your First Module

### Step 13: Generate User Module

```bash
# Generate complete module with all files
nest generate resource user

# When prompted:
# ? What transport layer do you use? GraphQL (code first)
# ? Would you like to generate CRUD entry points? Yes
```

This creates:

- `src/user/user.module.ts`
- `src/user/user.resolver.ts`
- `src/user/user.service.ts`
- `src/user/entities/user.entity.ts`
- `src/user/dto/create-user.input.ts`
- `src/user/dto/update-user.input.ts`

### Step 14: Create GraphQL Entity

Update `src/user/entities/user.entity.ts`:

```typescript
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  role: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Don't expose password in GraphQL
  // password: string;
}
```

### Step 15: Create DTOs (Data Transfer Objects)

Update `src/user/dto/create-user.input.ts`:

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @MinLength(6)
  password: string;
}
```

Update `src/user/dto/update-user.input.ts`:

```typescript
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field()
  id: string;
}
```

### Step 16: Implement Service

Update `src/user/user.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserInput: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(createUserInput.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserInput,
        password: hashedPassword,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        posts: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: true,
      },
    });
  }

  async update(id: string, updateUserInput: UpdateUserInput) {
    const data: any = { ...updateUserInput };

    if (updateUserInput.password) {
      data.password = await bcrypt.hash(updateUserInput.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

### Step 17: Implement Resolver

Update `src/user/user.resolver.ts`:

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.userService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.userService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id') id: string) {
    return this.userService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.userService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id') id: string) {
    return this.userService.remove(id);
  }
}
```

### Step 18: Register Module

Update `src/app.module.ts` to include UserModule:

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.GRAPHQL_PLAYGROUND === 'true',
      debug: process.env.GRAPHQL_DEBUG === 'true',
      context: ({ req, res }) => ({ req, res }),
    }),
    PrismaModule,
    UserModule, // Add this
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## Testing the API

### Step 19: Start the Server

```bash
# Start development server
pnpm start:dev

# Server should start at http://localhost:3000
# GraphQL Playground at http://localhost:3000/graphql
```

### Step 20: Test GraphQL Queries

Open GraphQL Playground at `http://localhost:3000/graphql`

#### Create a User (Mutation)

```graphql
mutation {
  createUser(
    createUserInput: {
      email: "john@example.com"
      name: "John Doe"
      password: "password123"
    }
  ) {
    id
    email
    name
    role
    createdAt
  }
}
```

#### Get All Users (Query)

```graphql
query {
  users {
    id
    email
    name
    role
    createdAt
    updatedAt
  }
}
```

#### Get Single User (Query)

```graphql
query {
  user(id: "your-user-id-here") {
    id
    email
    name
    role
    createdAt
  }
}
```

#### Update User (Mutation)

```graphql
mutation {
  updateUser(updateUserInput: { id: "your-user-id-here", name: "Jane Doe" }) {
    id
    email
    name
  }
}
```

#### Delete User (Mutation)

```graphql
mutation {
  removeUser(id: "your-user-id-here") {
    id
    email
    name
  }
}
```

---

## Additional Configuration

### Step 21: Add Global Exception Filter (Optional)

Create `src/common/filters/http-exception.filter.ts`:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    return exception;
  }
}
```

### Step 22: Add Logging Interceptor (Optional)

Create `src/common/interceptors/logging.interceptor.ts`:

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next
      .handle()
      .pipe(tap(() => console.log(`Request took ${Date.now() - now}ms`)));
  }
}
```

### Step 23: Add Database Seeding (Optional)

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Regular User',
      password: await bcrypt.hash('user123', 10),
      role: 'USER',
    },
  });

  // Create posts
  await prisma.post.createMany({
    data: [
      {
        title: 'First Post',
        content: 'This is the first post',
        published: true,
        authorId: user1.id,
      },
      {
        title: 'Second Post',
        content: 'This is the second post',
        published: false,
        authorId: user2.id,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Install ts-node if not already installed:

```bash
pnpm add -D ts-node
```

Run seeding:

```bash
pnpm prisma db seed
```

---

## Best Practices

### 1. **Project Structure**

```
src/
├── common/              # Shared utilities, guards, decorators
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/              # Configuration files
├── prisma/              # Prisma service and module
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── user/                # Feature modules
│   ├── dto/
│   ├── entities/
│   ├── user.module.ts
│   ├── user.resolver.ts
│   └── user.service.ts
├── app.module.ts
└── main.ts
```

### 2. **Environment Variables**

- Never commit `.env` files
- Always provide `.env.example`
- Use `@nestjs/config` for type-safe configuration
- Validate environment variables on startup

### 3. **Error Handling**

- Use custom exception filters
- Provide meaningful error messages
- Log errors properly
- Don't expose sensitive information

### 4. **Security**

```bash
# Install security packages
pnpm add helmet
pnpm add @nestjs/throttler

# Add to main.ts:
import helmet from 'helmet';
app.use(helmet());
```

### 5. **Database Best Practices**

- Always use migrations (never `prisma db push` in production)
- Use transactions for complex operations
- Index frequently queried fields
- Use soft deletes when appropriate

### 6. **Testing**

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

### 7. **Code Quality**

```bash
# Linting
pnpm lint

# Formatting
pnpm format

# Type checking
pnpm build
```

---

## Quick Reference Commands

```bash
# Project setup
nest new project-name
pnpm install

# Generate resources
nest g resource module-name
nest g service service-name
nest g resolver resolver-name
nest g module module-name

# Prisma commands
pnpm prisma init
pnpm prisma generate
pnpm prisma migrate dev --name migration-name
pnpm prisma migrate deploy
pnpm prisma studio
pnpm prisma db seed

# Development
pnpm start:dev
pnpm start:debug
pnpm start:prod

# Testing
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:e2e

# Code quality
pnpm lint
pnpm format
```

---

## Common Issues & Solutions

### Issue 1: Prisma Client Not Found

```bash
# Solution:
pnpm prisma generate
```

### Issue 2: Database Connection Error

```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
docker-compose ps
```

### Issue 3: GraphQL Schema Not Generating

```bash
# Ensure autoSchemaFile is set correctly in app.module.ts
# Restart the server
```

### Issue 4: Port Already in Use

```bash
# Change PORT in .env
# Or kill the process using the port
```

---

## Next Steps

1. **Add Authentication**: Implement JWT authentication
2. **Add Authorization**: Role-based access control (RBAC)
3. **Add File Upload**: Handle file uploads with GraphQL
4. **Add Caching**: Implement Redis caching
5. **Add Real-time**: WebSocket subscriptions
6. **Add Testing**: Write comprehensive tests
7. **Add Documentation**: Generate API documentation
8. **Add Monitoring**: Implement logging and monitoring
9. **Deploy**: Deploy to production (Vercel, Railway, AWS, etc.)

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS GraphQL](https://docs.nestjs.com/graphql/quick-start)
- [Prisma with NestJS](https://docs.nestjs.com/recipes/prisma)

---

**Congratulations! 🎉** You now have a fully functional NestJS + GraphQL + Prisma + PostgreSQL backend!
