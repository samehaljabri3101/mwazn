import { Module } from '@nestjs/common';
import { RFQsService } from './rfqs.service';
import { RFQsController } from './rfqs.controller';
import { RfqImagesService } from './rfq-images.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [RFQsService, RfqImagesService],
  controllers: [RFQsController],
  exports: [RFQsService],
})
export class RFQsModule {}
