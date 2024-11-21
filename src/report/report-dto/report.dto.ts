import { IsNumber, IsString } from 'class-validator';

export class HeathReportDto {
  @IsNumber()
  weight: number;

  @IsNumber()
  fat: number;

  @IsNumber()
  muscle: number;

  @IsString()
  userId: string;
}

export class FoodReportDto {
  @IsString()
  comment: string;

  @IsString()
  userId: string;
}
