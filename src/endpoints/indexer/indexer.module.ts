import { Module } from '@nestjs/common';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import {HttpModule} from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  controllers: [IndexerController],
  providers: [IndexerService],
  exports: [
    IndexerService,
  ],
})
export class IndexerModule {}
