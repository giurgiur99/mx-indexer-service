import { Module } from '@nestjs/common';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiConfigModule } from '../../common/api-config/api.config.module';
import { ApiConfigService } from '../../common/api-config/api.config.service';
import { IndexerData } from './entities/indexer.data.schema';

@Module({
  //add postgres module here
  imports: [
    HttpModule,
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => ({
        type: 'postgres',
        ...apiConfigService.getPostgresConnection(),
        entities: [IndexerData],
        keepConnectionAlive: true,
        synchronize: true,
      }),
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([IndexerData]),
  ],
  controllers: [IndexerController],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}
