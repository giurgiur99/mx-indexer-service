import { Module } from '@nestjs/common';
import { ExampleModule } from './example/example.module';
import { TestSocketModule } from './test-sockets/test.socket.module';
import { TokenModule } from './tokens/token.module';
import { UsersModule } from './users/user.module';
import { IndexerModule } from './indexer/indexer.module';

@Module({
  imports: [
    ExampleModule,
    TestSocketModule,
    UsersModule,
    TokenModule,
    IndexerModule,
  ],
  exports: [
    ExampleModule,
    TestSocketModule,
    UsersModule,
    TokenModule,
    IndexerModule,
  ],
})
export class EndpointsServicesModule {}
