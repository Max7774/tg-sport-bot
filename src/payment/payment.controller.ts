import { Controller, Get, Param, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Response } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get(':subscriptionUuid')
  async redirectToPayment(
    @Param('subscriptionUuid') subscriptionUuid: string,
    @Res() res: Response,
  ) {
    return await this.paymentService.redirectToPayment(subscriptionUuid, res);
  }
}
