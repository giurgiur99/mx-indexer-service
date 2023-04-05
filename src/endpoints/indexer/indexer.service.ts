import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { MexPair } from './entities/mex-pairs.entity';
import { dexDataDTO } from './entities/indexer.entity';
import { NotFoundException } from './indexer.error';
import {
  IndexerData,
  IndexerDataDocument,
} from './entities/indexer.data.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IndexerInterface } from './indexer.interface';
import { XexchangeIndexer } from './implementations/xexchange.indexer';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(IndexerData.name)
    private readonly indexerDataModel: Model<IndexerDataDocument>,
  ) { }

  getIndexer(name: string): IndexerInterface | undefined {
    switch (name) {
      case 'xexchange':
        return new XexchangeIndexer();
    }

    return undefined;
  }

  async indexInterval(_start: Date, _end: Date, _indexer: IndexerInterface): Promise<void> {
    // TODO:
    // - delete from the database all rows for the given indexer
    // - fetch all logs between start and end emitted by the given contracts
    // - call getPairChange that should decode the swapTokensFixedInput & swapTokensFixedOutput events for now
    // - insert the results in the database
    //   - the table structure should be the following;
    //     - exchange: string
    //     - pair: string 
    //     - price: number
    //     - volume: number
    //     - timestamp: number
  }

  async startIndexing(dexData: dexDataDTO) {
    const api = dexData.api;
    const { data } = await firstValueFrom(
      this.httpService.get(api).pipe(
        catchError((err: AxiosError) => {
          this.logger.error(err.response?.data);
          throw new NotFoundException('Err fetching data from API');
        }),
      ),
    );
    const apiData = data.map((pair: MexPair) => {
      return {
        address: pair.address,
        pairId: pair.id,
        price: pair.price,
        pair: pair.baseSymbol + pair.quoteSymbol,
        volume: pair.volume24h,
        provider: dexData.provider,
      };
    });
    return await this.indexerDataModel.insertMany(apiData);
  }
  getPairs() {
    return this.indexerDataModel.find<IndexerData>();
  }

  async getContracts(): Promise<any> {
    const api = 'https://index.multiversx.com/logs/_search';
    const query = {
      query: {
        nested: {
          path: 'events',
          query: {
            bool: {
              must: [
                {
                  match: {
                    'events.identifier': 'swapTokensFixedInput',
                  },
                },
              ],
              must_not: [
                {
                  exists: {
                    field: 'events.data',
                  },
                },
              ],
            },
          },
        },
      },
    };

    const { data } = await firstValueFrom(
      this.httpService.post<LogsResponse>(api, query).pipe(
        catchError((err: AxiosError) => {
          this.logger.error(err.response?.data);
          throw new NotFoundException(
            err.response
              ? err.response.statusText
              : 'Err fetching data from API',
          );
        }),
      ),
    );

    return data.hits.hits.map((hit) => {
      const logs: any[] = [];
      const result = hit._source.events.find(
        (event) => event.identifier === 'swapTokensFixedInput',
      );
      if (result) {
        result.topics.forEach((topic) => {
          const buffer = Buffer.from(topic, 'base64');
          logs.push(buffer.toString('utf-8'));
        });
      }

      return logs;
    });
  }
}
