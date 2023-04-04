import { Module } from '@nestjs/common';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import { HttpModule } from '@nestjs/axios';
import { NoSQLDatabaseModule } from '../../common/database/nosql.module';
import { MongooseModule } from '@nestjs/mongoose';
import { IndexerData, IndexerDataSchema } from './entities/indexer.data.schema';

@Module({
  imports: [
    HttpModule,
    NoSQLDatabaseModule,
    MongooseModule.forFeature([
      { name: IndexerData.name, schema: IndexerDataSchema },
    ]),
  ],
  controllers: [IndexerController],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}
