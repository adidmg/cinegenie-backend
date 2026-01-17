import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  const port = process.env.PORT || 8080;

  await app.listen(port, '0.0.0.0');
}
bootstrap();
