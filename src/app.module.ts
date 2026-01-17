import { Module } from '@nestjs/common';
import { GenresModule } from './genres/genres.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesModule } from './movies/movies.module';
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
        url: configService.get<string>('DATABASE_URL'),
        ssl:
          configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
    }),
    MoviesModule,
    GeminiApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
