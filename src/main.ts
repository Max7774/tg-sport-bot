import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { PrismaService } from './prisma/prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false,
  });

  const prismaService = app.get(PrismaService);
  await prismaService.$connect();

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  process.on('SIGINT', async () => {
    await prismaService.$disconnect();
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await prismaService.$disconnect();
    await app.close();
    process.exit(0);
  });

  await app.listen(5777);
}
bootstrap();
