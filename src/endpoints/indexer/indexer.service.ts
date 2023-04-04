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

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(IndexerData.name)
    private readonly indexerDataModel: Model<IndexerDataDocument>,
  ) {}

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
  async getPairs() {
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
          throw 'Err fetching contracts';
        }),
      ),
    );

    return data.hits.hits.map((hit) =>
      hit._source.events.find(
        (event) => event.identifier === 'swapTokensFixedInput',
      ),
    );
  }
}
