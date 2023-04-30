import { PairChange } from './entities/pair.change';

export interface IndexerInterface {
  getName(): string;

  getContracts(): Promise<string[]>;

  getPairs(): Promise<(string | undefined)[]>;

  getPairChange(event: any): Promise<PairChange[]>;

  startIndexing(
    before: number,
    after: number,
    hash?: string,
    from?: number,
    size?: number,
  ): Promise<any>;
}
