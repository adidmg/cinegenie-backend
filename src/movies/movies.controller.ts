import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('/')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  findAll(
    @Query('search') search: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.moviesService.findAll(search, page, limit);
  }
  @Get('genres/:genre')
  findMany(
    @Param('genre') genre: string,
    @Query('search') search: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.moviesService.findByGenre(genre, search, page, limit);
  }

  @Post('watchlist')
  findWatchlisted(
    @Body() ids: string[],
    @Query('search') search: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.moviesService.findWatchlisted(ids, search, page, limit);
  }

  @Get('gpt')
  findwithGPT(
    @Query('prompt') prompt: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.moviesService.findwithGPT(prompt, page, limit);
  }
}
