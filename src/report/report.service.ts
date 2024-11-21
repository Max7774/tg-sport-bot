import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { uuidGen } from 'utils/uuidGen';
import { FoodReportDto, HeathReportDto } from './report-dto/report.dto';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getUserHealthReport(userId: string) {
    const { uuid } = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        uuid: true,
      },
    });

    const report = await this.prisma.heathReport.findMany({
      where: { userUuid: uuid },
      select: {
        uuid: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            username: true,
          },
        },
        weight: true,
        fat: true,
        muscle: true,
      },
    });

    return report;
  }

  async getUserFoodReport(userId: string) {
    const { uuid } = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        uuid: true,
      },
    });

    const report = await this.prisma.foodReport.findMany({
      where: { userUuid: uuid },
      select: {
        uuid: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            username: true,
          },
        },
        image: true,
        comment: true,
      },
    });

    return report;
  }

  async createFoodReport(file: Express.Multer.File, dto: FoodReportDto) {
    const { filename } = file;

    const { uuid } = await this.prisma.user.findUnique({
      where: { userId: dto.userId },
      select: {
        uuid: true,
      },
    });

    const report = await this.prisma.foodReport.create({
      data: {
        uuid: uuidGen(),
        createdAt: new Date(),
        updatedAt: new Date(),
        image: filename,
        comment: dto.comment,
        userUuid: uuid,
      },
    });

    return report;
  }

  async createHealthReport(dto: HeathReportDto) {
    const { uuid } = await this.prisma.user.findUnique({
      where: { userId: dto.userId },
      select: {
        uuid: true,
      },
    });

    const { weight, fat, muscle } = dto;

    const report = await this.prisma.heathReport.create({
      data: {
        uuid: uuidGen(),
        createdAt: new Date(),
        updatedAt: new Date(),
        weight,
        fat,
        muscle,
        userUuid: uuid,
      },
    });

    return report;
  }
}
