import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IndexerService } from './indexer.service';
import { dexDataDTO } from './entities/indexer.entity';
import { IndexerData } from './entities/indexer.data.schema';

@Controller('indexer')
@ApiTags('indexer')
export class IndexerController {
  constructor(private readonly indexerService: IndexerService) {}

  @Post('start')
  async startIndexing(@Body() body: dexDataDTO) {
    try {
      return await this.indexerService.startIndexing(body);
    } catch (e) {
      return e;
    }
  }

  @Get('pairs')
  async getPairs(): Promise<String[]> {
    const result = await this.indexerService.getPairs();
    if (!result) {
      throw new NotFoundException('No pairs found');
    }

    const pairs: String[] = [];
    if (result) {
      result.forEach((pair: IndexerData) => {
        pairs.push(pair.pair!);
      });
    }
    return pairs;
  }

  @Get('contracts')
  async getContracts(): Promise<any> {
    return await this.indexerService.getContracts();
  }
}
