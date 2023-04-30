import { Injectable } from '@nestjs/common';
import {
  AddressUtils,
  BinaryUtils,
  ElasticQuery,
  ElasticService,
  ElasticSortOrder,
  ElasticSortProperty,
  QueryConditionOptions,
  QueryType,
} from '@multiversx/sdk-nestjs';

@Injectable()
export class ElasticIndexerService {
  constructor(private readonly elasticService: ElasticService) {}

  async getSwapTokenLogsCount(after: number, before: number): Promise<number> {
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

    const elasticQuery =
      ElasticQuery.create().withMustCondition(matchSwapTokens);

    if (after && before) {
      elasticQuery.withDateRangeFilter('timestamp', before, after);
    }

    return await this.elasticService.getCount('logs', elasticQuery);
  }

  async getSwapTokenLogByHash(hash: string): Promise<LogSwapToken[]> {
    const elasticQueryLogs = ElasticQuery.create().withCondition(
      QueryConditionOptions.must,
      QueryType.Match('_id', hash),
    );
    return await this.elasticService.getList('logs', 'id', elasticQueryLogs);
  }

  getSwapTokenLogs(
    action: (items: LogSwapToken[]) => Promise<void>,
    before: number,
    after: number,
    from?: number,
    size?: number,
  ): any {
    const sortOrder: ElasticSortOrder = ElasticSortOrder.descending;

    const nonce: ElasticSortProperty = { name: 'timestamp', order: sortOrder };

    const timestamp: ElasticSortProperty = {
      name: 'timestamp',
      order: sortOrder,
    };

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

    console.log(new Date(before), new Date(after));

    let elasticQuery = ElasticQuery.create()
      .withSort([timestamp, nonce])
      .withMustCondition(matchSwapTokens);

    if (before && after) {
      elasticQuery.withDateRangeFilter('timestamp', before, after);
    }

    if (size && from) {
      console.log('pagination', from, size);
      elasticQuery = elasticQuery.withPagination({
        from: 0,
        size: 10000,
      });
    }

    return this.elasticService.getScrollableList(
      'logs',
      key,
      elasticQuery,
      action,
    );
  }

  topicDecoder(identifier: string, topics: string[]): SmartContractData {
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
