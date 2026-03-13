import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminRespondAppealDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  adminResponse?: string;
}
