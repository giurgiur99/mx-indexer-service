import { PairChange } from "./entities/pair.change";

export interface IndexerInterface {
  getName(): string;

  getContracts(): Promise<string[]>;

  getPairs(): Promise<string[]>;

  getPairChange(event: any): Promise<PairChange[]>;
}
