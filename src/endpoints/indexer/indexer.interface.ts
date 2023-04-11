import { TransactionLog } from './entities';
import { PairChange } from './entities/pair.change';

export interface IndexerInterface {
  getTransactionLogs(hashes: string[]): Promise<TransactionLog[]>;

  getName(): string;

  getContracts(): Promise<string[]>;

  getPairs(): Promise<string[]>;

  getPairChange(event: any): Promise<PairChange[]>;
}
