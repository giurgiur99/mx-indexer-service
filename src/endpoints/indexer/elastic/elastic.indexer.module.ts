import { Global, Module } from '@nestjs/common';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { ElasticIndexerService } from './elastic.indexer.service';

@Global()
@Module({
  imports: [ApiConfigModule, DynamicModuleUtils.getElasticModule()],
  providers: [ElasticIndexerService],
  exports: [ElasticIndexerService],
})
export class ElasticIndexerModule {}
