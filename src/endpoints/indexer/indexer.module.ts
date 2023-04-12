import { Global, Module } from '@nestjs/common';
import { PostgresIndexerModule } from './postgres/postgres.indexer.module';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import { ElasticIndexerModule } from './elastic/elastic.indexer.module';

@Global()
@Module({
  imports: [PostgresIndexerModule, ElasticIndexerModule],
  controllers: [IndexerController],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}
