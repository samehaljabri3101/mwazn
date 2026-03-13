import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AppealsModule } from '../appeals/appeals.module';
import { RatingsModule } from '../ratings/ratings.module';

@Module({
  imports: [AppealsModule, RatingsModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
