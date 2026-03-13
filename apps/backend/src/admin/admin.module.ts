import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AppealsModule } from '../appeals/appeals.module';

@Module({
  imports: [AppealsModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
