import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IndexerService } from './indexer.service';
import { MexPair } from './entities/mex-pairs.entity';

@Controller('indexer')
@ApiTags('indexer')
export class IndexerController {
  constructor(private readonly indexerService: IndexerService) {}

  @Get('pairs')
  async getPairs(): Promise<MexPair[]> {
    return await this.indexerService.getPairs();
  }

  @Get('contracts')
  async getContracts(): Promise<any> {
    return await this.indexerService.getContracts();
  }
}
