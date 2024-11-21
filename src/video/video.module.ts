import { Module } from '@nestjs/common';
import { VideosService } from './video.service';
import { VideosController } from './video.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
