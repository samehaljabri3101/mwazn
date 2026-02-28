import { Module } from '@nestjs/common';
import { RFQsService } from './rfqs.service';
import { RFQsController } from './rfqs.controller';
import { RfqImagesService } from './rfq-images.service';

@Module({
  providers: [RFQsService, RfqImagesService],
  controllers: [RFQsController],
  exports: [RFQsService],
})
export class RFQsModule {}
