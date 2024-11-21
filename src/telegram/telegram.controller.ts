import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('notification')
  async getNotification(@Req() req: Request, @Res() res: Response) {
    return await this.telegramService.getNotification(req, res);
  }
}
