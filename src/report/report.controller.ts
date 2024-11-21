import {
  Body,
  Controller,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { HeathReportDto } from './report-dto/report.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Get('food/:userId')
  async getUserFoodReport(@Param('userId') userId: string) {
    return await this.reportService.getUserFoodReport(userId);
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Get('health/:userId')
  async getUserHealthReport(@Param('userId') userId: string) {
    return await this.reportService.getUserHealthReport(userId);
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('health')
  async createUserHealthReport(@Body() dto: HeathReportDto) {
    return await this.reportService.createHealthReport(dto);
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post('food/:userId')
  @UseInterceptors(FileInterceptor('file'))
  async createFoodReport(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
      }),
    )
    file: Express.Multer.File,
    @Param('userId') userId: string,
    @Body() dto: { comment: string },
  ) {
    const currentDto = {
      comment: dto.comment,
      userId,
    };
    return await this.reportService.createFoodReport(file, currentDto);
  }

  @Get(':fileName')
  async serveFile(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<any> {
    return res.sendFile(fileName, { root: process.env.DESTINATION });
  }
}
