import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/endpoints/users/entities/user.entity';
import { ApiConfigModule } from '../api-config/api.config.module';
import { ApiConfigService } from '../api-config/api.config.service';
import { IndexerData } from '../../endpoints/indexer/entities/indexer.data.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => ({
        type: 'mysql',
        ...apiConfigService.getDatabaseConnection(),
        entities: [User],
        keepConnectionAlive: true,
        synchronize: true,
      }),
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([User]),
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
  exports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([IndexerData]),
  ],
})
export class DatabaseModule {}
