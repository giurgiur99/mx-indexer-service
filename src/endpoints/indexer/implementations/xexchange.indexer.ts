import { PairChange } from "../entities/pair.change";
import { IndexerInterface } from "../indexer.interface";

export class XexchangeIndexer implements IndexerInterface {
  getName(): string {
    return 'xexchange';
  }

  // eslint-disable-next-line require-await
  async getContracts(): Promise<string[]> {
    return [
      'erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq',
    ];
  }

  // eslint-disable-next-line require-await
  async getPairs(): Promise<string[]> {
    return [
      'WEGLDUSDC',
    ];
  }

  // eslint-disable-next-line require-await
  async getPairChange(_event: any): Promise<PairChange[]> {
    // TODO: decode swapTokensFixedInput, swapTokensFixedOutput event that returns price & volume
    return [];
  }
}
