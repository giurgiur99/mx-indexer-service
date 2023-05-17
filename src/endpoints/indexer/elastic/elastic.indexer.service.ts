import { Injectable } from '@nestjs/common';
import {
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

  async getSwapTokenLogs(before: number, after: number): Promise<any[]> {
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

    let elasticQuery = ElasticQuery.create()
      .withSort([timestamp, nonce])
      .withMustCondition(matchSwapTokens)
      .withPagination({ from: 0, size: 10000 });

    if (before && after) {
      elasticQuery.withDateRangeFilter('timestamp', before, after);
    }

    const logs: SmartContractEvent[] = [];

    await this.elasticService.getScrollableList(
      'logs',
      key,
      elasticQuery,
      async (items) => {
        for (const item of items) {
          logs.push(item);
        }
        console.log('logs', logs.length);
      },
    );

    console.log(logs);
    return logs;
  }

  topicDecoder(identifier: string, topics: string[]): SmartContractData {
    switch (identifier) {
      case 'swapTokensFixedOutput':
      case 'swapTokensFixedInput': {
        const action = BinaryUtils.base64Decode(topics[0]);
        const tokenIn = BinaryUtils.tryBase64ToHex(topics[1]);
        const tokenOut = BinaryUtils.tryBase64ToHex(topics[2]);
        const address = BinaryUtils.tryBase64ToAddress(topics[3]);
        return {
          action,
          tokenIn: tokenIn ? BinaryUtils.base64Decode(topics[1]) : topics[1],
          tokenOut: tokenOut ? BinaryUtils.base64Decode(topics[2]) : topics[2],
          address: address ? address : topics[3],
        };
      }
      case 'MultiESDTNFTTransfer':
      case 'ESDTTransfer': {
        const amount = BinaryUtils.tryBase64ToBigInt(topics[2]);
        const token = BinaryUtils.base64Decode(topics[0]);
        const address = BinaryUtils.tryBase64ToAddress(topics[3]);
        return {
          token,
          amount: amount ?? BigInt(0),
          address: address ? address : topics[3],
        };
      }
      case 'ESDTLocalBurn': {
        const amount = BinaryUtils.tryBase64ToBigInt(topics[2]);
        const token = BinaryUtils.base64Decode(topics[0]);
        return {
          token,
          amount: amount ?? BigInt(0),
        };
      }
      case 'depositSwapFees': {
        const action = BinaryUtils.base64Decode(topics[0]);
        const address = BinaryUtils.tryBase64ToAddress(topics[1]);
        return {
          action,
          address: address ? address : topics[1],
        };
      }
      default:
        return {
          value: topics,
        };
    }
  }
}
