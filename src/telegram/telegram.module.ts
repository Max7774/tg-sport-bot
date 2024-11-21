import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from './telegram.service';
import { VideosService } from 'src/video/video.service';
import { AuthModule } from 'src/auth/auth.module';
import { VideosModule } from 'src/video/video.module';
import { PaymentService } from 'src/payment/payment.service';
import { TelegramController } from './telegram.controller';

@Module({
  controllers: [TelegramController],
  imports: [ConfigModule, AuthModule, VideosModule],
  providers: [TelegramService, PrismaService, VideosService, PaymentService],
  exports: [TelegramService],
})
export class TelegramModule {}
