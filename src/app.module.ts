import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideosModule } from './video/video.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from './payment/payment.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    VideosModule,
    PrismaModule,
    AuthModule,
    TelegramModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PaymentModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
