import { Global, Module } from '@nestjs/common';
import { PostgresIndexerModule } from './postgres/postgres.indexer.module';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';

@Global()
@Module({
  imports: [PostgresIndexerModule],
  controllers: [IndexerController],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}
