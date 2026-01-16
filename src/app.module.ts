import { Module } from '@nestjs/common';
import { GenresModule } from './genres/genres.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesModule } from './movies/movies.module';
import { Genre } from './genres/entities/genre.entity';
import { Movie } from './movies/entities/movie.entity';
import { GeminiApiModule } from './gemini-api/gemini-api.module';

@Module({
  imports: [
    GenresModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [Genre, Movie],
      }),
    }),
    MoviesModule,
    GeminiApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
