import { PairChange } from '../entities/pair.change';
import { IndexerInterface } from '../indexer.interface';
import { IndexerData } from '../postgres/entities/indexer.data.entity';
import { ElasticIndexerService } from '../elastic/elastic.indexer.service';
import { PostgresIndexerService } from '../postgres/postgres.indexer.service';

export class XexchangeIndexer implements IndexerInterface {
  constructor(
    private readonly postgresIndexerService: PostgresIndexerService,
    private readonly elasticIndexerService: ElasticIndexerService,
  ) {}
  getName(): string {
    return 'xexchange';
  }

  // eslint-disable-next-line require-await
  async getContracts(): Promise<string[]> {
    return ['erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq'];
  }

  // eslint-disable-next-line require-await
  async getPairs(): Promise<(string | undefined)[]> {
    return await this.postgresIndexerService.getPairs();
  }

  // eslint-disable-next-line require-await
  async getPairChange(_event: any): Promise<PairChange[]> {
    // TODO: decode swapTokensFixedInput, swapTokensFixedOutput event that returns price & volume
    return [];
  }

  async startIndexing(
    before: number,
    after: number,
    hash?: string,
    from?: number,
    size?: number,
  ): Promise<any> {
    await this.postgresIndexerService.clear();

    //duplicate detector by hash
    //price
    // - Ex. Swap 31000 ZPAY for a minimum of 84.22030673074847279 WEGLD
    // - Divide 31000 by 84.22030673074847279 = 368.1
    // Fees saved as varchar
    // Test volumes using https://xexchange.com/analytics by querying the database for days & months ex WAM/EGLD

    let data: LogSwapToken[] = [];
    const isHash = !!hash;

    if (isHash) {
      data = await this.elasticIndexerService.getSwapTokenLogByHash(hash);
    } else {
      data = await new Promise(async (resolve) => {
        this.elasticIndexerService.getSwapTokenLogs(
          async (items) => {
            resolve(items);
          },
          before,
          after,
          from,
          size,
        );
      });
    }

    const decodedEvents = data.map((item) => {
      const timestamp = item.timestamp ?? '0';
      const hash = isHash ? item.id : item.swapTokensFixedInput ?? '0';
      const events = item.events.map((event: SmartContractEvent) => {
        return {
          address: event.address,
          identifier: event.identifier,
          topics: this.elasticIndexerService.topicDecoder(
            event.identifier,
            event.topics,
          ),
        };
      });
      return { hash, timestamp, events };
    });

    const indexerEntries: IndexerData[] = [];
    for (const event of decodedEvents) {
      const indexerDataEntry = this.calculateIndexerDataEntry(
        event.events,
        event.timestamp,
        event.hash,
      );
      indexerEntries.push(indexerDataEntry);
      await this.postgresIndexerService.addIndexerData(indexerDataEntry);
    }

    return {
      indexerEntries: indexerEntries,
      // logsSwapToken: logsSwapToken,
    };
  }

  calculateIndexerDataEntry(
    decodedEvents: SmartContractDecodedEvent[],
    timestamp: string,
    hash?: string,
  ): IndexerData {
    const feesCollectorAddress =
      'erd1qqqqqqqqqqqqqpgqjsnxqprks7qxfwkcg2m2v9hxkrchgm9akp2segrswt';

    const swapTokensEvent = decodedEvents.find(
      (event: SmartContractDecodedEvent) =>
        event.identifier === 'swapTokensFixedInput' ||
        event.identifier === 'swapTokensFixedOutput',
    );

    const pair =
      swapTokensEvent?.topics.tokenIn + '/' + swapTokensEvent?.topics.tokenOut;
    const outAddress = swapTokensEvent?.topics.address;

    const ESDTLocalBurn = decodedEvents.find(
      (event: SmartContractDecodedEvent) =>
        event.identifier === 'ESDTLocalBurn',
    )?.topics.amount;

    const fees = decodedEvents.find(
      (event: SmartContractDecodedEvent) =>
        event.topics.address === feesCollectorAddress,
    )?.topics.amount;

    const WEGLDVolume = decodedEvents.find(
      (event: SmartContractDecodedEvent) =>
        event.topics.token === 'WEGLD-bd4d79' &&
        (event.address === outAddress || event.topics.address === outAddress),
    )?.topics.amount;

    return {
      hash,
      address: outAddress,
      pair,
      volume: Number(WEGLDVolume),
      burn: Number(ESDTLocalBurn),
      fee: Number(fees),
      timestamp,
      provider: 'xexchange',
    };
  }
}
