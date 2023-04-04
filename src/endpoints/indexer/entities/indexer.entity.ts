enum dexDataRequestIndexing {
  volume = 'volume',
  price = 'price',
  pairs = 'pairs',
}

export interface IndexerEntity {
  id: string;
  api: string;
  query: string;
  status: string;
}

export interface dexDataDTO {
  api: string;
  provider: string;
  requestIndexing: dexDataRequestIndexing;
}
