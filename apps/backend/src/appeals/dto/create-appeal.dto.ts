import { IsEnum, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { AppealTargetType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppealDto {
  @ApiProperty({ enum: AppealTargetType })
  @IsEnum(AppealTargetType)
  targetType: AppealTargetType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason: string;
}
