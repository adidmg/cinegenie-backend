import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { GeminiApiModule } from 'src/gemini-api/gemini-api.module';

@Module({
  imports: [TypeOrmModule.forFeature([Movie]), GeminiApiModule],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
