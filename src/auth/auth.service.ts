import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { uuidGen } from '../../utils/uuidGen';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  // async login(dto: AuthDto) {
  //   // const user = await this.validateUser(dto);

  //   const tokens = await this.issueTokens(user.uuid);

  //   return {
  //     user: this.returnUserFields(user),
  //     ...tokens,
  //   };
  // }

  // async getNewToken(refreshToken: string) {
  //   const result = await this.jwt.verifyAsync(refreshToken);

  //   if (!result) throw new UnauthorizedException('Invalid refresh token');

  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       uuid: result.uuid,
  //     },
  //   });

  //   const tokens = await this.issueTokens(user.uuid);

  //   return {
  //     user: this.returnUserFields(user),
  //     ...tokens,
  //   };
  // }

  // async register(dto: AuthDto) {
  //   const oldUser = await this.prisma.user.findUnique({
  //     where: {
  //       username: dto.username,
  //     },
  //   });

  //   if (oldUser) throw new BadGatewayException('User already exists');

  //   const user = await this.prisma.user.create({
  //     data: {
  //       uuid: uuidGen(),
  //       username: dto.username,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     },
  //   });

  //   const tokens = await this.issueTokens(user.uuid);

  //   return {
  //     user: this.returnUserFields(user),
  //     ...tokens,
  //   };
  // }

  // private async issueTokens(uuid: string) {
  //   const data = { uuid: uuid };

  //   const accessToken = this.jwt.sign(data, {
  //     expiresIn: '1d',
  //   });

  //   const refreshToken = this.jwt.sign(data, {
  //     expiresIn: '7d',
  //   });

  //   return { accessToken, refreshToken };
  // }

  // private returnUserFields(user: User) {
  //   return {
  //     username: user.username,
  //   };
  // }

  // private async validateUser(dto: AuthDto) {
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       username: dto.username,
  //     },
  //   });

  //   if (!user) throw new NotFoundException('User not found');

  //   return user;
  // }
}
