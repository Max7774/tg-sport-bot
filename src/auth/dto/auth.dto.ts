import { IsOptional, IsString } from 'class-validator';

export class AuthDto {
  @IsOptional()
  @IsString()
  username: string;

  @IsString()
  password: string;
}
