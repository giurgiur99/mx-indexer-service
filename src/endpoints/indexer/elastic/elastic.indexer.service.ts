import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AddressUtils,
  ElasticQuery,
  ElasticService,
  ElasticSortOrder,
  ElasticSortProperty,
} from '@multiversx/sdk-nestjs';

@Injectable()
export class ElasticIndexerService {
  constructor(private readonly elasticService: ElasticService) {}

  async getSwapTokenLogs(
    _start: Date,
    _end: Date,
    key: string,
  ): Promise<any[]> {
    const sortOrder: ElasticSortOrder = ElasticSortOrder.descending;

    const timestamp: ElasticSortProperty = {
      name: 'timestamp',
      order: sortOrder,
    };
    const nonce: ElasticSortProperty = { name: 'timestamp', order: sortOrder };
    const startDate = new Date(_start).getTime();
    const endDate = new Date(_end).getTime();

    const elasticQuery = ElasticQuery.create()
      .withPagination({
        from: 0,
        size: 10,
      })
      .withSort([timestamp, nonce])
      .withDateRangeFilter('timestamp', startDate, endDate);

    return await this.elasticService.getList('logs', key, elasticQuery);
  }

  async decodeLogs(address: string) {
    const isAddressValid = AddressUtils.isAddressValid(address);
    if (!isAddressValid) {
      return new NotFoundException('Address is not valid');
    }
    return isAddressValid;
  }

  async getTransactions(_start: Date, _end: Date, key: string): Promise<any[]> {
    const sortOrder: ElasticSortOrder = ElasticSortOrder.descending;
    const startDate = new Date(_start).getTime();
    const endDate = new Date(_end).getTime();

    const timestamp: ElasticSortProperty = {
      name: 'timestamp',
      order: sortOrder,
    };
    const nonce: ElasticSortProperty = { name: 'timestamp', order: sortOrder };

    const elasticQuery = ElasticQuery.create()
      .withMustMatchCondition('function', key)
      .withSort([timestamp, nonce])
      .withDateRangeFilter('timestamp', startDate, endDate)
      .withPagination({ from: 0, size: 5 });

    const logs = await this.elasticService.getList(
      'transactions',
      'txHash',
      elasticQuery,
    );

    return logs.map((log) => ({
      txHash: log.txHash,
      value: log.value,
      receiver: log.receiver,
      sender: log.sender,
      gasUsed: log.gasUsed,
      fee: log.fee,
      initialPaidFee: log.initialPaidFee,
      timestamp: log.timestamp,
      tokens: log.tokens,
      function: log.function,
    }));
  }
}
