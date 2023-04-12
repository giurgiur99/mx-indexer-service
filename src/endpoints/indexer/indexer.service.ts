import { Injectable } from '@nestjs/common';
import { IndexerInterface } from './indexer.interface';
import { XexchangeIndexer } from './implementations/xexchange.indexer';
import { PostgresIndexerService } from './postgres/postgres.indexer.service';
import { ElasticIndexerService } from './elastic/elastic.indexer.service';
import { TransactionLog } from './entities/transaction.log';

@Injectable()
export class IndexerService {
  constructor(
    private readonly postgresIndexerService: PostgresIndexerService,
    private readonly elasticIndexerService: ElasticIndexerService,
  ) {}

  getIndexer(name: string): IndexerInterface | undefined {
    switch (name) {
      case 'xexchange':
        return new XexchangeIndexer();
    }

    return undefined;
  }

  async indexInterval(_start: Date, _end: Date, _indexer: IndexerInterface) {
    // TODO:
    // - delete from the database all rows for the given indexer
    await this.postgresIndexerService.clear();
    // - fetch all logs between start and end emitted by the given contracts using elastisearch
    const logsSwapTokensFixedInput =
      await this.elasticIndexerService.getSwapTokenLogs(
        _start,
        _end,
        'swapTokensFixedInput',
      );

    const logsSwapTokensFixedOutput =
      await this.elasticIndexerService.getSwapTokenLogs(
        _start,
        _end,
        'swapTokensFixedOutput',
      );

    const transactionsSwapTokensFixedInput: TransactionLog[] =
      await this.elasticIndexerService.getTransactions(
        _start,
        _end,
        'swapTokensFixedInput',
      );

    const transactionsSwapTokensFixedOutput: TransactionLog[] =
      await this.elasticIndexerService.getTransactions(
        _start,
        _end,
        'swapTokensFixedOutput',
      );

    // match logsSwapTokensFixedInput with logsSwapTokensFixedOutput based on address

    // - decode the logs
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

    return {
      transactionsSwapTokensFixedInput,
      transactionsSwapTokensFixedOutput,
      swapFixedInput: logsSwapTokensFixedInput,
      swapFixedOutput: logsSwapTokensFixedOutput,
    };
  }
}
