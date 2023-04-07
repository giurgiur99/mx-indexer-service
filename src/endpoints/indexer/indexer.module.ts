import { Module } from '@nestjs/common';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import { HttpModule } from '@nestjs/axios';
import { ApiConfigModule } from '../../common/api-config/api.config.module';
import {
  ApiModuleOptions,
  ApiService,
  ElasticModuleOptions,
  ElasticService,
} from '@multiversx/sdk-nestjs';

@Module({
  //add postgres module here
  imports: [HttpModule, ApiConfigModule],
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
