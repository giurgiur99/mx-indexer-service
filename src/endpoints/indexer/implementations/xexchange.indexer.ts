import { PairChange } from '../entities/pair.change';
import { IndexerInterface } from '../indexer.interface';
import { IndexerData } from '../postgres/entities/indexer.data.entity';
import { ElasticIndexerService } from '../elastic/elastic.indexer.service';
import { PostgresIndexerService } from '../postgres/postgres.indexer.service';
import { NumberUtils } from '@multiversx/sdk-nestjs';

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
  ): Promise<IndexerData[]> {
    //duplicate detector by hash
    //price
    // - Ex. Swap 31000 ZPAY for a minimum of 84.22030673074847279 WEGLD
    // - Divide 31000 by 84.22030673074847279 = 368.1
    // Fees saved as varchar
    // Volume Recieved WEGLD + Fees
    // 0.05% burn from 0.3%

    let data: LogSwapToken[] = [];
    const isHash = !!hash;

    if (isHash) {
      data = await this.elasticIndexerService.getSwapTokenLogByHash(hash);
    } else {
      data = await this.elasticIndexerService.getSwapTokenLogs(before, after);
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

    let indexerEntries: IndexerData[] = [];
    if (decodedEvents.length === 1) {
      const event = decodedEvents[0];
      const indexerDataEntry = this.calculateIndexerDataEntry(
        event.events,
        event.timestamp,
        event.hash,
      );
      indexerEntries.push(indexerDataEntry);
      await this.postgresIndexerService.bulkAddIndexerData(indexerEntries);
      return indexerEntries;
    }
    for (let i = 0; i < decodedEvents.length; i++) {
      const event = decodedEvents[i];
      const indexerDataEntry = this.calculateIndexerDataEntry(
        event.events,
        event.timestamp,
        event.hash,
      );
      indexerEntries.push(indexerDataEntry);
      if (i % 5000 === 0) {
        await this.postgresIndexerService.bulkAddIndexerData(indexerEntries);
        indexerEntries = [];
      }
    }

    if (indexerEntries.length > 0) {
      await this.postgresIndexerService.bulkAddIndexerData(indexerEntries);
    }

    return indexerEntries;
  }

  calculateIndexerDataEntry(
    decodedEvents: SmartContractDecodedEvent[],
    timestamp: string,
    hash?: string,
  ): IndexerData {
    const feesCollectorAddress =
      'erd1qqqqqqqqqqqqqpgqjsnxqprks7qxfwkcg2m2v9hxkrchgm9akp2segrswt';
    const MexWegldPoolAddress =
      'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2';

    const swapTokensEvent = decodedEvents.find(
      (event: SmartContractDecodedEvent) => {
        if (event.topics.action === 'swap') {
          return (
            event.identifier === 'swapTokensFixedInput' ||
            event.identifier === 'swapTokensFixedOutput' ||
            event.identifier === 'swap'
          );
        }
        return false;
      },
    );

    const pair =
      swapTokensEvent?.topics.tokenIn + '/' + swapTokensEvent?.topics.tokenOut;
    const outAddress = swapTokensEvent?.topics.address;

    const ESDTLocalBurn = decodedEvents.find(
      (event: SmartContractDecodedEvent) =>
        event.identifier === 'ESDTLocalBurn',
    )?.topics.amount;

    let fees = decodedEvents.find(
      (event: SmartContractDecodedEvent) =>
        event.topics.address === feesCollectorAddress,
    )?.topics.amount;

    if (!fees) {
      fees = decodedEvents.find(
        (event: SmartContractDecodedEvent) =>
          event.topics.address === MexWegldPoolAddress,
      )?.topics.amount;
    }

    const priceOutEvent = decodedEvents.find(
      (event: SmartContractDecodedEvent) =>
        event.topics.token === swapTokensEvent?.topics.tokenOut,
    )?.topics.amount;
    const priceInEvent = decodedEvents.find(
      (event: SmartContractDecodedEvent) =>
        event.topics.token === swapTokensEvent?.topics.tokenIn,
    )?.topics.amount;

    const price = Number(priceOutEvent) / Number(priceInEvent);

    let WEGLDVolume = decodedEvents.find(
      (event: SmartContractDecodedEvent) =>
        event.topics.token === 'WEGLD-bd4d79' &&
        (event.address === outAddress || event.topics.address === outAddress),
    )?.topics.amount;

    // if (swapTokensEvent?.topics.tokenIn !== 'WEGLD-bd4d79') {
    //   WEGLDVolume = Number(WEGLDVolume) - (0.3 * Number(WEGLDVolume)) / 100;
    // }

    const numberWEGLDVolume = WEGLDVolume
      ? NumberUtils.denominate(WEGLDVolume, 18)
      : 0;
    const numberBurn = ESDTLocalBurn
      ? NumberUtils.denominate(ESDTLocalBurn, 18)
      : 0;
    const numberFees = fees ? NumberUtils.denominate(fees, 18) : 0;

    return {
      hash,
      address: outAddress,
      pair,
      tokenIn: swapTokensEvent?.topics.tokenIn,
      tokenOut: swapTokensEvent?.topics.tokenOut,
      price,
      volume: numberWEGLDVolume,
      burn: numberBurn,
      fee: numberFees,
      timestamp,
      date: new Date(Number(timestamp) * 1000).addHours(-3).toISOString(),
      provider: 'xexchange',
    };
  }
}
