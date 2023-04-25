interface LogSwapToken {
  swapTokensFixedInput?: string;
  id?: string;
  events: SmartContractEvent[];
}

interface SmartContractEvent {
  identifier: string;
  address: string;
  data?: string;
  topics: string[];
  order?: number;
}

interface SmartContractDecodedEvent {
  identifier: string;
  address: string;
  data?: string;
  topics: SmartContractData;
  order?: number;
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
