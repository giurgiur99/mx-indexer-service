import { Injectable } from '@nestjs/common';

import { TransactionLog } from './entities';
import { IndexerInterface } from './indexer.interface';
import { XexchangeIndexer } from './implementations/xexchange.indexer';
import { PostgresIndexerService } from './postgres/postgres.indexer.service';

@Injectable()
export class IndexerService {
  constructor(private readonly indexerPostgres: PostgresIndexerService) {}

  async getTransactionLogs(hashes: string[]): Promise<TransactionLog[]> {
    return await this.indexerPostgres.getTransactionLogs(hashes);
  }

  getIndexer(name: string): IndexerInterface | undefined {
    switch (name) {
      case 'xexchange':
        return new XexchangeIndexer();
    }

    return undefined;
  }

  async indexInterval(
    _start: Date,
    _end: Date,
    _indexer: IndexerInterface,
  ): Promise<void> {
    // TODO:
    // - delete from the database all rows for the given indexer
    // await this.indexerDataRepository.clear();
    // - fetch all logs between start and end emitted by the given contracts using elastisearch
    // await this.elasticService.get('logs');
    // const queries: AbstractQuery | AbstractQuery[] = [];
    // // for (const hash of hashes) {
    // //   queries.push(QueryType.Match('_id', hash));
    // // }
    //
    // const elasticQueryLogs = ElasticQuery.create()
    //   .withPagination({ from: 0, size: 10000 })
    //   .withCondition(QueryConditionOptions.should, queries);
    //
    // const logs = await this.elasticService.getList(
    //   'logs',
    //   'id',
    //   elasticQueryLogs,
    // );
    // console.log(logs);
    //   - use can use ElasticService for this
    // - call getPairChange that should decode the swapTokensFixedInput & swapTokensFixedOutput events for now
    // - insert the results in the database
    //   - the table structure should be the following;
    //     - exchange: string
    //     - pair: string
    //     - price: number
    //     - volume: number
    //     - fee: number (populate with 0 for now)
    //     - timestamp: number
    // decoding address: (AAAAAAAAAAAFAAa0axUJHXMOXzuMh8PpyKXYGMe6VIM=)
    // AddressUtils.bech32Encode(BinaryUtils.base64ToHex('AAAAAAAAAAAFAAa0axUJHXMOXzuMh8PpyKXYGMe6VIM='))
  }
}
