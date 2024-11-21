import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentService {
  private readonly PAYMENT_URL = process.env.YOOMONEY_URL as string;
  private readonly PAYMENT_CARD = process.env.YOOMONEY_CARD as string;

  constructor(
    private prisma: PrismaService, // private telegramService: TelegramService,
  ) {}

  async generatePaymentLink(amount: number, label: string, userUuid: string) {
    const params = new URLSearchParams();
    params.append('receiver', this.PAYMENT_CARD);
    params.append('quickpay-form', 'donate');
    params.append('targets', 'Пополнение счета в боте');
    params.append('paymentType', 'AC');
    params.append('sum', amount.toString());
    params.append('label', `${label}/${userUuid}`);

    const yooMoneyPaymentLink = `${this.PAYMENT_URL}?${params.toString()}`;

    const { uuid } = await this.prisma.subscription.update({
      where: { userUuid },
      data: {
        paymentLink: yooMoneyPaymentLink,
      },
    });

    const paymentLink = `${process.env.CLIENT_URL}/payment/${uuid}`;

    return { paymentLink, subscriptionUuid: uuid };
  }

  async redirectToPayment(subscriptionUuid: string, res: Response) {
    const { paymentLink } = await this.prisma.subscription.findUnique({
      where: {
        uuid: subscriptionUuid,
      },
    });

    return res.redirect(paymentLink);
  }
}
