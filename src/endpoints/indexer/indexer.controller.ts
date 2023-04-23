import {
  Controller,
  forwardRef,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { IndexerService } from './indexer.service';
// import { IndexerService } from './indexer.service';

@Controller('indexer')
export class IndexerController {
  constructor(
    @Inject(forwardRef(() => IndexerService))
    private readonly indexerService: IndexerService,
  ) {}

  @Get()
  async get(): Promise<any> {
    return 'Indexer';
  }

  @Get(':name/start')
  async startIndexing(
    @Query('endDate') endDate: Date,
    @Query('startDate') startDate: Date,
    @Query('hash') hash: string,
    @Param('name') name: string,
  ) {
    try {
      const indexer = this.indexerService.getIndexer(name);
      if (!indexer) return new NotFoundException('Indexer not found');
      return await this.indexerService.indexInterval(
        startDate,
        endDate,
        indexer,
        hash,
      );
    } catch (e) {
      return e;
    }
  }
  //
  // @Get(':name/pairs')
  // async getPairs(@Param('name') name: string): Promise<String[]> {
  //   const indexer = this.indexerService.getIndexer(name);
  //   const result = await indexer?.getPairs();
  //   if (!result) {
  //     throw new NotFoundException('No pairs found');
  //   }
  //
  //   return result;
  // }
  //
  // @Get(':name/contracts')
  // async getContracts(@Param('name') name: string): Promise<any> {
  //   try {
  //     const indexer = this.indexerService.getIndexer(name);
  //     return await indexer?.getContracts();
  //   } catch (e) {
  //     return e;
  //   }
  // }
}
