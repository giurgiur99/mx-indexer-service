import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { PostgresIndexerService } from './postgres.indexer.service';
import { IndexerData } from '../entities/indexer.data.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      name: 'postgresConnection',
      useFactory: (apiConfigService: ApiConfigService) => {
        const options: TypeOrmModuleOptions = {
          type: 'postgres',
          ...apiConfigService.getPostgresConnection(),
          entities: [IndexerData],
          keepConnectionAlive: true,
          synchronize: false,
          retryAttempts: 300,
        };

        return options;
      },
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([IndexerData], 'postgresConnection'),
  ],
  providers: [PostgresIndexerService],
  exports: [
    PostgresIndexerService,
    TypeOrmModule.forFeature([IndexerData], 'postgresConnection'),
  ],
})
export class PostgresIndexerModule {}
