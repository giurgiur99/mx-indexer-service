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

  async bulkAddIndexerData(data: IndexerData[]) {
    try {
      // return await this.indexerData.insert(data);
      for (let i = 0; i < data.length; i++) {
        await this.indexerData.save(data[i]);
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async getPairs(): Promise<(string | undefined)[]> {
    const pairs = await this.indexerData.find();
    return pairs.map((pair) => pair.pair);
  }
}
