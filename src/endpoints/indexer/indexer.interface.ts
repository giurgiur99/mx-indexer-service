import { PairChange } from './entities/pair.change';
import { IndexerData } from './postgres/entities/indexer.data.entity';

export interface IndexerInterface {
  getName(): string;

  getContracts(): Promise<string[]>;

  getPairs(): Promise<(string | undefined)[]>;

  getPairChange(event: any): Promise<PairChange[]>;

  startIndexing(
    before: number,
    after: number,
    hash?: string,
  ): Promise<IndexerData[]>;
}
