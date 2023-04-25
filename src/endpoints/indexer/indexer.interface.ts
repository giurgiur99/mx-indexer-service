import { PairChange } from './entities/pair.change';

export interface IndexerInterface {
  getName(): string;

  getContracts(): Promise<string[]>;

  getPairs(): Promise<string[]>;

  getPairChange(event: any): Promise<PairChange[]>;

  startIndexing(_start: Date, _end: Date, hash?: string): Promise<any>;
}
