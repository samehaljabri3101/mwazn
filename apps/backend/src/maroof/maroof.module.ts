import { Global, Module } from '@nestjs/common';
import { MaroofService } from './maroof.service';

@Global()
@Module({
  providers: [MaroofService],
  exports: [MaroofService],
})
export class MaroofModule {}
