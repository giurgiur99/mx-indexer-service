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
    @Query('before') before: Date,
    @Query('after') after: Date,
    @Query('hash') hash: string,
    @Param('name') name: string,
  ) {
    try {
      const indexer = this.indexerService.getIndexer(name);
      if (!indexer) return new NotFoundException('Indexer not found');
      //Use romanian time
      const timestampBefore = new Date(before).addHours(3).getTime() / 1000;
      const timestampAfter = new Date(after).addHours(3).getTime() / 1000;
      console.log(timestampBefore, timestampAfter);
      return await this.indexerService.indexIntervalSdk(
        timestampBefore,
        timestampAfter,
        name,
        hash,
      );
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Get(':name/pairs')
  async getPairs(@Param('name') name: string): Promise<(string | undefined)[]> {
    const indexer = this.indexerService.getIndexer(name);
    const result = await indexer?.getPairs();
    if (!result) {
      throw new NotFoundException('No pairs found');
    }

    return result;
  }
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
