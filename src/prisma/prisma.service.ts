import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<
    Prisma.PrismaClientOptions,
    'beforeExit' | 'info' | 'warn' | 'error'
  >
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
  }
}
