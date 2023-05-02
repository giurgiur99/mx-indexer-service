interface LogSwapToken {
  hash: string;
  swapTokensFixedInput?: string;
  id?: string;
  events: SmartContractEvent[];
  timestamp?: string;
}

interface SmartContractEvent {
  identifier: string;
  address: string;
  data?: string;
  topics: string[];
  order?: number;
  timestamp?: string;
}

interface SmartContractDecodedEvent {
  identifier: string;
  address: string;
  data?: string;
  topics: SmartContractData;
  order?: number;
  timestamp?: string;
  hash?: string;
}

interface SmartContractData {
  action?: string;
  token?: string;
  tokenIn?: string;
  tokenOut?: string;
  address?: string;
  amount?: number;
  value?: string[];
}
