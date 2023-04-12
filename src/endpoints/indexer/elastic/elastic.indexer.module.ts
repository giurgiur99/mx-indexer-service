import { Global, Module } from '@nestjs/common';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { ElasticIndexerService } from './elastic.indexer.service';
import { GuestCachingService } from '@multiversx/sdk-nestjs';

@Global()
@Module({
  imports: [
    ApiConfigModule,
    DynamicModuleUtils.getCachingModule(),
    DynamicModuleUtils.getElasticModule(),
    DynamicModuleUtils.getApiModule(),
  ],
  providers: [ElasticIndexerService, GuestCachingService],
  exports: [ElasticIndexerService],
})
export class ElasticIndexerModule {}
