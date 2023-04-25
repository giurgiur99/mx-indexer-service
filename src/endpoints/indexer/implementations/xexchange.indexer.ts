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
  async getPairs(): Promise<string[]> {
    return ['WEGLDUSDC'];
  }

  // eslint-disable-next-line require-await
  async getPairChange(_event: any): Promise<PairChange[]> {
    // TODO: decode swapTokensFixedInput, swapTokensFixedOutput event that returns price & volume
    return [];
  }

  async getTransactionLogs(_hashes: string[]): Promise<any[]> {
    return [];
  }

  async startIndexing(_start: Date, _end: Date, hash?: string): Promise<any> {
    // await this.postgresIndexerService.clear();

    let logsEvents: any;
    let logsSwapToken: any | any[];

    if (hash) {
      logsSwapToken = await this.elasticIndexerService.getSwapTokenLogByHash(
        hash,
      );
      logsEvents = [logsSwapToken[0].events];
    } else {
      logsSwapToken = await this.elasticIndexerService.getSwapTokenLogs(
        _start,
        _end,
      );
      logsEvents = logsSwapToken.map((log: { events: any[] }) => log.events);
    }

    const decodedEvents: any[] = logsEvents.map((event: any[]) =>
      event.map((e: any) => {
        return {
          identifier: e.identifier,
          address: e.address,
          topics: this.elasticIndexerService.topicDecoder(
            e.identifier,
            e.topics,
          ),
        };
      }),
    );

    const indexerEntries: IndexerData[] = [];
    for (const event of decodedEvents) {
      const indexerDataEntry = this.calculateIndexerDataEntry(event);
      indexerEntries.push(indexerDataEntry);
      await this.postgresIndexerService.addIndexerData(indexerDataEntry);
    }

    return {
      indexerEntries: indexerEntries,
      decodedEvents: decodedEvents,
      logsEvents,
      hash: hash,
    };
  }

  calculateIndexerDataEntry(decodedEvents: any): IndexerData {
    const feesCollectorAddress =
      'erd1qqqqqqqqqqqqqpgqjsnxqprks7qxfwkcg2m2v9hxkrchgm9akp2segrswt';

    const swapTokensEvent = decodedEvents.find(
      (event: any) =>
        event.identifier === 'swapTokensFixedInput' ||
        event.identifier === 'swapTokensFixedOutput',
    );

    const pair =
      swapTokensEvent.topics.tokenIn + '/' + swapTokensEvent.topics.tokenOut;
    const ownerAddress = swapTokensEvent.topics.address;

    const ESDTLocalBurn = decodedEvents.find(
      (event: any) => event.identifier === 'ESDTLocalBurn',
    )?.topics.amount;

    const fees = decodedEvents.find(
      (event: any) => event.topics.address === feesCollectorAddress,
    )?.topics.amount;

    const WEGLDVolume = decodedEvents.find(
      (event: any) => event.topics.address === ownerAddress,
    )?.topics.amount;

    return {
      address: swapTokensEvent.address,
      pair,
      volume: Number(WEGLDVolume),
      burn: Number(ESDTLocalBurn),
      fee: Number(fees),
      timestamp: new Date(),
      provider: 'xexchange',
    };
  }
}
