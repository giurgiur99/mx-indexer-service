import { PairChange } from '../entities/pair.change';
import { IndexerInterface } from '../indexer.interface';
import { IndexerData } from '../postgres/entities/indexer.data.entity';
import { ElasticIndexerService } from '../elastic/elastic.indexer.service';
import { PostgresIndexerService } from '../postgres/postgres.indexer.service';
import { NumberUtils } from '@multiversx/sdk-nestjs';
import {
  RawEvent,
  RawEventType,
  SwapEvent,
  SwapEventType,
} from '@multiversx/sdk-exchange';

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

  async startIndexingSdk(
    before: number,
    after: number,
    hash?: string,
  ): Promise<any> {
    const isHash = !!hash;

    let data = [];
    let transactions = [];
    if (isHash) {
      data = await this.elasticIndexerService.getSwapTokenLogByHash(hash);
    } else {
      data = await this.elasticIndexerService.getSwapTokenLogs(before, after);
      transactions = (
        await this.elasticIndexerService.getTransactions(before, after)
      ).map((tx) => tx.identifier);
    }

    const decodedEvents = data.map((item) => {
      const identifier = item.identifier ?? '0';
      const functions = item.function ?? '0';
      const timestamp = item.timestamp ?? '0';
      return {
        identifier,
        timestamp,
        functions,
        events: item.events.map((event: RawEventType) => {
          switch (event.identifier) {
            case 'swapTokensFixedOutput':
            case 'swapTokensFixedInput':
              return new SwapEvent(event);
            default:
              return new RawEvent(event);
          }
        }) as (RawEventType | SwapEventType)[],
      };
    });

    let indexerEntries: IndexerData[] = [];
    for (let i = 0; i < decodedEvents.length; i++) {
      const event = decodedEvents[i];
      // const swapEvent = transactions.find(
      //   (tx) =>
      //     tx === event.identifier ||
      //     tx === event.events.map((e) => e.identifier),
      // );
      const swapEvent = false;
      if (!swapEvent) {
        const swapTokenEventList = event.events.filter(
          (e: RawEventType) =>
            e.identifier === 'swapTokensFixedOutput' ||
            e.identifier === 'swapTokensFixedInput',
        ) as SwapEvent[];

        try {
          swapTokenEventList.map((swapTokenEvent) => {
            if (swapTokenEvent) {
              const tokenIn = swapTokenEvent.getTokenIn()?.tokenID;
              const tokenOut = swapTokenEvent.getTokenOut()?.tokenID;
              let volume;
              let checkUSDC = false;
              if (tokenIn === 'USDC-c76f1f' || tokenOut === 'USDC-c76f1f') {
                checkUSDC = true;
                volume = (
                  tokenIn === 'USDC-c76f1f'
                    ? swapTokenEvent.getTokenIn()?.amount
                    : swapTokenEvent.getTokenOut()?.amount
                ) as BigInt | undefined;
              } else
                volume = (
                  tokenIn === 'WEGLD-bd4d79'
                    ? swapTokenEvent.getTokenIn()?.amount
                    : swapTokenEvent.getTokenOut()?.amount
                ) as BigInt | undefined;
              const fee = swapTokenEvent.feeAmount as BigInt | undefined;
              const date = new Date(Number(event.timestamp) * 1000)
                .addHours(-3)
                .toISOString();

              const indexerDataEntry: IndexerData = {
                date,
                provider: 'xexchange',
                hash: event.identifier,
                timestamp: event.timestamp,
                tokenIn,
                tokenOut,
                pair: `${tokenIn}/${tokenOut}`,
                volume: checkUSDC
                  ? NumberUtils.denominate(volume!, 6)
                  : NumberUtils.denominate(volume!, 18),
                fee: NumberUtils.denominate(fee!, 18),
              };

              indexerEntries.push(indexerDataEntry);
            }
          });
        } catch (e) {
          console.log('Error: ', e);
        }
      }

      if (i % 5000 === 0 && i !== 0) {
        await this.postgresIndexerService.bulkAddIndexerData(indexerEntries);
        indexerEntries = [];
      }
    }

    if (indexerEntries.length > 0) {
      await this.postgresIndexerService.bulkAddIndexerData(indexerEntries);
    }

    return {
      transactionsLength: transactions.length,

      data,
      decodedEventsLength: decodedEvents.length,
    };
  }

  /**
   * @deprecated
   */
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
            event.identifier === 'swapTokensFixedOutput'
          );
        }
        return false;
      },
    );

    const pair =
      swapTokensEvent?.topics.tokenIn + '/' + swapTokensEvent?.topics.tokenOut;
    const outAddress = swapTokensEvent?.topics.address;

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

    const numberFees = fees ? NumberUtils.denominate(fees, 18) : 0;

    return {
      hash,
      address: outAddress,
      pair,
      tokenIn: swapTokensEvent?.topics.tokenIn,
      tokenOut: swapTokensEvent?.topics.tokenOut,
      price,
      volume: numberWEGLDVolume,
      fee: numberFees,
      timestamp,
      date: new Date(Number(timestamp) * 1000).addHours(-3).toISOString(),
      provider: 'xexchange',
    };
  }
}
