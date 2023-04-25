import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IndexerData } from './entities/indexer.data.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostgresIndexerService {
  constructor(
    @InjectRepository(IndexerData, 'postgresConnection')
    private readonly indexerData: Repository<IndexerData>,
  ) {}

  async clear(): Promise<void> {
    return await this.indexerData.clear();
  }

  async addIndexerData(data: IndexerData): Promise<IndexerData> {
    return await this.indexerData.save(data);
  }
}
