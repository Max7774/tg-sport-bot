import { UseGuards, applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';

export const Auth = () => applyDecorators(UseGuards(JwtAuthGuard));
