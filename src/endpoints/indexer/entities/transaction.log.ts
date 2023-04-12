export interface TransactionLog {
  txHash: string;
  value: string;
  receiver: string;
  sender: string;
  gasUsed: string;
  fee: string;
  initialPaidFee: string;
  timestamp: string;
  tokens: [];
  function: string;
}
