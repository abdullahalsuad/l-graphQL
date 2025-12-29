import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { GraphQLErrorFilter } from './common/filters/graphql-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GraphQLErrorFilter());

  const config = new DocumentBuilder()
    .setTitle('MyRizq API')
    .setDescription('MyRizq API description')
    .setVersion('1.0')
    .addTag('APIs')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  // Custom options for Swagger UI
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'MyRizq API',
  };

  SwaggerModule.setup('api', app, documentFactory, customOptions);

  await app.listen(process.env.PORT ?? 8000);

  console.log(`✅ Server is running on http://localhost:${process.env.PORT}`);
}
bootstrap();
