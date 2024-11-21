import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Video, Prisma } from '@prisma/client';
import { uuidGen } from 'utils/uuidGen';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  async createVideo(data: Video): Promise<Video> {
    return this.prisma.video.create({
      data: {
        uuid: uuidGen(),
        ...data,
      },
    });
  }

  async findAll(): Promise<Video[]> {
    return this.prisma.video.findMany();
  }

  async findOne(uuid: string): Promise<Video | null> {
    return this.prisma.video.findUnique({
      where: { uuid },
    });
  }

  async updateVideo(
    uuid: string,
    data: Prisma.VideoUpdateInput,
  ): Promise<Video> {
    return this.prisma.video.update({
      where: { uuid },
      data,
    });
  }

  async removeVideo(uuid: string): Promise<Video> {
    return this.prisma.video.delete({
      where: { uuid },
    });
  }

  async findByGroup(group: string): Promise<Video[]> {
    return this.prisma.video.findMany({
      where: {
        muscleGroup: {
          name: group,
        },
      },
    });
  }
}
