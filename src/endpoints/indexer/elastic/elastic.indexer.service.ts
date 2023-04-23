import { Injectable } from '@nestjs/common';
import {
  AddressUtils,
  BinaryUtils,
  ElasticQuery,
  ElasticService,
  ElasticSortOrder,
  ElasticSortProperty,
  QueryType,
} from '@multiversx/sdk-nestjs';

@Injectable()
export class ElasticIndexerService {
  constructor(private readonly elasticService: ElasticService) {}

  async getSwapTokenLogs(
    _start: Date,
    _end: Date,
    hash?: string,
  ): Promise<any[]> {
    const sortOrder: ElasticSortOrder = ElasticSortOrder.descending;

    const nonce: ElasticSortProperty = { name: 'timestamp', order: sortOrder };
    const startDate = new Date(_start).getTime();
    const endDate = new Date(_end).getTime();

    const timestamp: ElasticSortProperty = {
      name: 'timestamp',
      order: sortOrder,
    };

    if (hash) {
      console.log(`hash:${hash}`);
      return await this.elasticService.getItem('logs', 'id', hash);
    }

    const matchSwapTokens = [
      QueryType.Should([
        QueryType.Nested('events', {
          'events.identifier': 'swapTokensFixedInput',
        }),
        QueryType.Nested('events', {
          'events.identifier': 'swapTokensFixedOutput',
        }),
      ]),
    ];

    const key = 'swapTokensFixedInput';

    const elasticQuery = ElasticQuery.create()
      .withPagination({
        from: 0,
        size: 1,
      })
      .withSort([timestamp, nonce])
      .withMustCondition(matchSwapTokens)
      .withDateRangeFilter('timestamp', startDate, endDate);

    return await this.elasticService.getList('logs', key, elasticQuery);
  }

  async topicDecoder(identifier: string, topics: string[]): Promise<any> {
    switch (identifier) {
      case 'swapTokensFixedOutput':
      case 'swapTokensFixedInput':
        return {
          action: BinaryUtils.base64Decode(topics[0]),
          tokenIn: BinaryUtils.base64Decode(topics[1]),
          tokenOut: BinaryUtils.base64Decode(topics[2]),
          address: AddressUtils.bech32Encode(
            BinaryUtils.base64ToHex(topics[3]),
          ),
        };
      case 'ESDTTransfer':
        return {
          token: BinaryUtils.base64Decode(topics[0]),
          amount: parseInt(BinaryUtils.base64ToBigInt(topics[2]).toString()),
          address: AddressUtils.bech32Encode(
            BinaryUtils.base64ToHex(topics[3]),
          ),
        };
      case 'ESDTLocalBurn':
        return {
          token: BinaryUtils.base64Decode(topics[0]),
          amount: parseInt(BinaryUtils.base64ToBigInt(topics[2]).toString()),
        };
      case 'depositSwapFees':
        return {
          action: BinaryUtils.base64Decode(topics[0]),
          address: AddressUtils.bech32Encode(
            BinaryUtils.base64ToHex(topics[1]),
          ),
        };
      default:
        return {
          value: topics,
        };
    }
  }
}
