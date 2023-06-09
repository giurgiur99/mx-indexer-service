import { CachingService, NativeAuthAdminGuard, NativeAuthGuard } from "@multiversx/sdk-nestjs";
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Inject, Param, Put, Query, UseGuards } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ApiResponse } from "@nestjs/swagger";
import { CacheValue } from "./entities/cache.value";

@Controller()
export class CacheController {
  constructor(
    private readonly cachingService: CachingService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  @UseGuards(NativeAuthGuard, NativeAuthAdminGuard)
  @Get("/caching/:key")
  @ApiResponse({
    status: 200,
    description: 'The cache value for one key',
    type: String,
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found',
  })
  async getCache(@Param('key') key: string): Promise<unknown> {
    const value = await this.cachingService.getCacheRemote(key);
    if (!value) {
      throw new HttpException('Key not found', HttpStatus.NOT_FOUND);
    }
    return JSON.stringify(value);
  }

  @UseGuards(NativeAuthGuard, NativeAuthAdminGuard)
  @Put("/caching/:key")
  @ApiResponse({
    status: 200,
    description: 'Key has been updated',
  })
  async setCache(@Param('key') key: string, @Body() cacheValue: CacheValue) {
    await this.cachingService.setCacheRemote(key, cacheValue.value, cacheValue.ttl);
    this.clientProxy.emit('deleteCacheKeys', [key]);
  }

  @UseGuards(NativeAuthGuard, NativeAuthAdminGuard)
  @Delete("/caching/:key")
  @ApiResponse({
    status: 200,
    description: 'Key has been deleted from cache',
  })
  @ApiResponse({
    status: 404,
    description: 'Key not found',
  })
  async delCache(@Param('key') key: string) {
    const keys = await this.cachingService.deleteInCache(key);
    this.clientProxy.emit('deleteCacheKeys', keys);
  }

  @UseGuards(NativeAuthGuard, NativeAuthAdminGuard)
  @Get("/caching")
  async getKeys(
    @Query('keys') keys: string | undefined,
  ): Promise<string[]> {
    return await this.cachingService.getKeys(keys);
  }
}
