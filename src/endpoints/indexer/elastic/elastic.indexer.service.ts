import { Injectable } from '@nestjs/common';
import {
  ElasticService,
  ElasticQuery,
  QueryType,
  QueryConditionOptions,
} from '@multiversx/sdk-nestjs';
import { PairChange } from '../entities/pair.change';

@Injectable()
export class ElasticIndexerService {
  constructor(private readonly elasticService: ElasticService) {}

  async getTransactionLogs(hashes: string[]): Promise<any[]> {
    const queries = [];
    for (const hash of hashes) {
      queries.push(QueryType.Match('_id', hash));
    }

    const elasticQueryLogs = ElasticQuery.create()
      .withPagination({ from: 0, size: 10000 })
      .withCondition(QueryConditionOptions.should, queries);

    return await this.elasticService.getList('logs', 'id', elasticQueryLogs);
  }
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
}
