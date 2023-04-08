import { Module } from '@nestjs/common';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import { HttpModule } from '@nestjs/axios';
import {
  ApiModuleOptions,
  ApiService,
  ElasticModuleOptions,
  ElasticService,
} from '@multiversx/sdk-nestjs';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  //add postgres module here
  imports: [HttpModule, DatabaseModule],
  controllers: [IndexerController],
  providers: [
    IndexerService,
    ElasticService,
    ElasticModuleOptions,
    ApiService,
    ApiModuleOptions,
  ],
  exports: [IndexerService],
})
export class IndexerModule {}
