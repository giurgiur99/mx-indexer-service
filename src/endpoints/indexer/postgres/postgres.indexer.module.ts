import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { PostgresIndexerService } from './postgres.indexer.service';
import { entities } from './entities';
import { Repository } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => {
        const options: TypeOrmModuleOptions = {
          type: 'postgres',
          entities,
          ...apiConfigService.getPostgresConnection(),
          keepConnectionAlive: true,
          synchronize: false,
          retryAttempts: 300,
          ssl: true,
          extra: {
            connectionLimit: 4,
            ssl: {
              rejectUnauthorized: false,
            },
          },
        };

        return options;
      },
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [PostgresIndexerService, Repository],
  exports: [PostgresIndexerService, TypeOrmModule.forFeature(entities)],
})
export class PostgresIndexerModule {}
