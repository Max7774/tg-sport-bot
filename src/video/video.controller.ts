import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { VideosService } from './video.service';
import { Video } from '@prisma/client';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  create(@Body() createVideoDto: Video) {
    return this.videosService.createVideo(createVideoDto);
  }

  @Get()
  findAll() {
    return this.videosService.findAll();
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.videosService.findOne(uuid);
  }

  @Put(':uuid')
  update(@Param('uuid') uuid: string, @Body() updateVideoDto: Video) {
    return this.videosService.updateVideo(uuid, updateVideoDto);
  }

  @Delete(':uuid')
  remove(@Param('uuid') uuid: string) {
    return this.videosService.removeVideo(uuid);
  }
}
