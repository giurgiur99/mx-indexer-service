import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { MexPair } from './entities/mex-pairs.entity';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  constructor(private readonly httpService: HttpService) {}
  async getPairs(): Promise<MexPair[]> {
    const api = 'https://api.multiversx.com/mex/pairs';
    const { data } = await firstValueFrom(
      this.httpService.get(api).pipe(
        catchError((err: AxiosError) => {
          this.logger.error(err.response?.data);
          throw 'Err fetching pairs';
        }),
      ),
    );

    return data.map((pair: MexPair): { symbol: string; pair: string } => {
      return {
        symbol: pair.symbol,
        pair: pair.baseSymbol + pair.quoteSymbol,
      };
    });
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
