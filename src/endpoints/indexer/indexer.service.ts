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
        return new XexchangeIndexer();
    }

    return undefined;
  }

  async indexInterval(
    _start: Date,
    _end: Date,
    _indexer: IndexerInterface,
    hash?: string,
  ) {
    // TODO:
    // - delete from the database all rows for the given indexer
    await this.postgresIndexerService.clear();
    // - fetch all logs between start and end emitted by the given contracts using elastisearch
    // - search by events.identifier nested query and look for swapTokensFixedInput & swapTokensFixedOutput
    const logsSwapToken = await this.elasticIndexerService.getSwapTokenLogs(
      _start,
      _end,
      hash,
    );

    const logsEvents = logsSwapToken.map((log) => log.events);

    const decodedEvents = await Promise.all(
      logsEvents
        .flat()
        .map(
          async (event: {
            identifier: string;
            address: string;
            topics: string[];
          }) => {
            return {
              identifier: event.identifier,
              address: event.address,
              topics: await this.elasticIndexerService.topicDecoder(
                event.identifier,
                event.topics,
              ),
            };
          },
        ),
    );

    const indexerDataEntry = await this.calculateIndexerDataEntry(
      decodedEvents,
    );

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
      indexerDataEntry,
      decodedEvents,
      raw: logsSwapToken,
    };
  }

  async calculateIndexerDataEntry(decodedEvents: any) {
    const [feesCollectorAddress, MEXWEGLDPoolAddress] = [
      'erd1qqqqqqqqqqqqqpgqjsnxqprks7qxfwkcg2m2v9hxkrchgm9akp2segrswt',
      'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2',
    ];
    const swapTokensEvent = decodedEvents.find(
      (event: any) =>
        event.identifier === 'swapTokensFixedInput' ||
        event.identifier === 'swapTokensFixedOutput',
    );

    const pair =
      swapTokensEvent.topics.tokenIn + '/' + swapTokensEvent.topics.tokenOut;

    const ESDTTransferEvents = decodedEvents.filter(
      (event: any) => event.identifier === 'ESDTTransfer',
    );

    const ESDTLocalBurn = decodedEvents.find(
      (event: any) => event.identifier === 'ESDTLocalBurn',
    ).topics.amount;

    const fees = decodedEvents.find(
      (event: any) => event.topics.address === feesCollectorAddress,
    ).topics.amount;

    const WEGLDVolume = decodedEvents.find(
      (event: any) => event.topics.address === MEXWEGLDPoolAddress,
    ).topics.amount;

    return {
      address: ESDTTransferEvents[0].address,
      pair,
      WEGLDVolume,
      ESDTLocalBurn,
      fees,
      ESDTTransferEvents,
    };
  }
}
