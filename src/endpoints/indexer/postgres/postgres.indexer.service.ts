import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { IndexerInterface } from '../indexer.interface';
import { LogDb } from './entities';
import { PairChange } from '../entities/pair.change';

@Injectable()
export class PostgresIndexerService implements IndexerInterface {
  constructor(private readonly logsRepository: Repository<LogDb>) {}

  async getTransactionLogs(hashes: string[]): Promise<any[]> {
    const query = this.logsRepository
      .createQueryBuilder()
      .skip(0)
      .take(10000)
      .where('id IN (:...hashes)', { hashes });

    return await query.getMany();
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
