import { Module } from '@nestjs/common';
import { RFQsService } from './rfqs.service';
import { RFQsController } from './rfqs.controller';

@Module({
  providers: [RFQsService],
  controllers: [RFQsController],
  exports: [RFQsService],
})
export class RFQsModule {}
