enum MexPairState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
}

enum MexPairType {
  CORE = 'core',
  COMMUNITY = 'community',
  ECOSYSTEM = 'ecosystem',
  EXPERIMENTAL = 'experimental',
  JUNGLE = 'jungle',
  UNLISTED = 'unlisted',
}

export interface MexPair {
  id: string;
  address: string;
  symbol: string;
  name: string;
  price: number;
  baseId: string;
  basePrice: number;
  baseSymbol: string;
  baseName: string;
  quoteId: string;
  quotePrice: number;
  quoteSymbol: string;
  quoteName: string;
  totalValue: number;
  volume24h: number;
  state: MexPairState;
  type: MexPairType;
}
