import { Injectable } from '@nestjs/common';
import { IndexerInterface } from './indexer.interface';
import { XexchangeIndexer } from './implementations/xexchange.indexer';
import { PostgresIndexerService } from './postgres/postgres.indexer.service';
import { ElasticIndexerService } from './elastic/elastic.indexer.service';

@Injectable()
export class IndexerService {
  constructor(
    private readonly postgresIndexerService: PostgresIndexerService,
    private readonly elasticIndexerService: ElasticIndexerService,
  ) {}

  getIndexer(name: string): IndexerInterface | undefined {
    switch (name) {
      case 'xexchange':
        return new XexchangeIndexer(
          this.postgresIndexerService,
          this.elasticIndexerService,
        );
    }

    return undefined;
  }

  async indexInterval(
    before: number,
    after: number,
    indexerName: string,
    hash?: string,
    from?: number,
    size?: number,
  ) {
    const indexer = this.getIndexer(indexerName);
    if (!indexer) {
      throw new Error(`Indexer ${indexerName} not found`);
    }

    const countLogs = hash
      ? 1
      : await this.elasticIndexerService.getSwapTokenLogsCount(after, before);

    let results: any[] = [];

    if (from && size) {
      for (let i = from; i < countLogs; i += size) {
        const data = await indexer.startIndexing(before, after, hash, i, size);
        results.push(data);
      }
    }

    // TODO:
    // - delete from the database all rows for the given indexer
    // - fetch all logs between start and end emitted by the given contracts using elastisearch
    // - search by events.identifier nested query and look for swapTokensFixedInput & swapTokensFixedOutput

    // Decode data logs and tokens used?
    // Volume?
    // Map addres to token?

    // - all prices will be in egld
    // - find all swaps transactions
    // - decode the logs (4 transactions - 2 swapFixedInput & 2 swapFixedOutput)
    // -get esdt transfer from contract to wallet and reverse (be careful for the fee)
    // -volume will be generated by sum of wrapped egld
    // - populate the database with the results
    // - take into account the fee calculated by:
    // - Usdc to egld will be -0.3% fee (divide by 1-tax) e.g for example tva brut & net by multiplication
    // - call getPairChange that should decode the swapTokensFixedInput & swapTokensFixedOutput events for now
    // - insert the results in the database
    //   - the table structure should be the following;
    //     - exchange: string
    //     - pair: string
    //     - price: number
    //     - volume: number
    //     - fee: number (populate with 0 for now)
    //     - timestamp: number

    return {
      countLogs,
      results,
      done: true,
    };
  }
}
