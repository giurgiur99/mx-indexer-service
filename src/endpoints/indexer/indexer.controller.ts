import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IndexerService } from './indexer.service';

@Controller('indexer')
@ApiTags('indexer')
export class IndexerController {
  constructor(private readonly indexerService: IndexerService) {}

  @Post(':name/start')
  startIndexing(
    @Param('name') name: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    try {
      const indexer = this.indexerService.getIndexer(name);
      if (!indexer) return new NotFoundException('Indexer not found');
      return this.indexerService.indexInterval(startDate, endDate, indexer);
    } catch (e) {
      return e;
    }
  }

  @Get(':name/pairs')
  async getPairs(@Param('name') name: string): Promise<String[]> {
    const indexer = this.indexerService.getIndexer(name);
    const result = await indexer?.getPairs();
    if (!result) {
      throw new NotFoundException('No pairs found');
    }

    return result;
  }

  @Get(':name/contracts')
  async getContracts(@Param('name') name: string): Promise<any> {
    try {
      const indexer = this.indexerService.getIndexer(name);
      return await indexer?.getContracts();
    } catch (e) {
      return e;
    }
  }
}
