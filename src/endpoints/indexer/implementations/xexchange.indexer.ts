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

  async startIndexing(_start: Date, _end: Date, hash?: string): Promise<any> {
    // await this.postgresIndexerService.clear();

    let logsEvents: SmartContractEvent[][];
    let logsSwapToken: LogSwapToken[];

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
      logsEvents = logsSwapToken.map((log) => log.events);
    }

    const decodedEvents: SmartContractDecodedEvent[][] = logsEvents.map(
      (event: SmartContractEvent[]) =>
        event.map((e: SmartContractEvent) => {
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
      // logsSwapToken: logsSwapToken,
      indexerEntries: indexerEntries,
      decodedEvents: decodedEvents,
      logsEvents,
      hash: hash,
    };
  }

  calculateIndexerDataEntry(
    decodedEvents: SmartContractDecodedEvent[],
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
    const ownerAddress = swapTokensEvent?.topics.address;

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
        event.topics.address === ownerAddress,
    )?.topics.amount;

    return {
      address: swapTokensEvent?.address,
      pair,
      volume: Number(WEGLDVolume),
      burn: Number(ESDTLocalBurn),
      fee: Number(fees),
      timestamp: new Date(),
      provider: 'xexchange',
    };
  }
}
