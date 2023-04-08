import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { NotFoundException } from './indexer.error';
import { IndexerInterface } from './indexer.interface';
import { XexchangeIndexer } from './implementations/xexchange.indexer';
import { InjectRepository } from '@nestjs/typeorm';
import { IndexerData } from './entities/indexer.data.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);

  constructor(
    private readonly httpService: HttpService,
    // private readonly elasticService: ElasticService,
    @InjectRepository(IndexerData, 'indexer')
    private readonly indexerDataRepository: Repository<IndexerData>,
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
  ): Promise<void> {
    // TODO:
    // - delete from the database all rows for the given indexer
    await this.indexerDataRepository.clear();

    // - fetch all logs between start and end emitted by the given contracts using elastisearch
    // const queries: AbstractQuery | AbstractQuery[] = [];
    // // for (const hash of hashes) {
    // //   queries.push(QueryType.Match('_id', hash));
    // // }
    //
    // const elasticQueryLogs = ElasticQuery.create()
    //   .withPagination({ from: 0, size: 10000 })
    //   .withCondition(QueryConditionOptions.should, queries);
    //
    // const logs = await this.elasticService.getList(
    //   'logs',
    //   'id',
    //   elasticQueryLogs,
    // );
    // console.log(logs);

    //   - use can use ElasticService for this
    // - call getPairChange that should decode the swapTokensFixedInput & swapTokensFixedOutput events for now
    // - insert the results in the database
    //   - the table structure should be the following;
    //     - exchange: string
    //     - pair: string
    //     - price: number
    //     - volume: number
    //     - fee: number (populate with 0 for now)
    //     - timestamp: number
    // decoding address: (AAAAAAAAAAAFAAa0axUJHXMOXzuMh8PpyKXYGMe6VIM=)
    // AddressUtils.bech32Encode(BinaryUtils.base64ToHex('AAAAAAAAAAAFAAa0axUJHXMOXzuMh8PpyKXYGMe6VIM='))
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
