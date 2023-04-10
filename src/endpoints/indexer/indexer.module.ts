import { Module } from '@nestjs/common';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '../../common/database/database.module';
import { DynamicModuleUtils } from '../../utils/dynamic.module.utils';

@Module({
  imports: [HttpModule, DatabaseModule, DynamicModuleUtils.getElasticModule()],
  controllers: [IndexerController],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}
