import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { fileStorage } from 'utils/storage';

@Module({
  imports: [MulterModule.register({ storage: fileStorage })],
  controllers: [ReportController],
  providers: [ReportService, PrismaService],
})
export class ReportModule {}
