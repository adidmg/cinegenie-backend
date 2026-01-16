import { Module } from '@nestjs/common';
import { GeminiApiService } from './gemini-api.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [GeminiApiService],
  exports: [GeminiApiService],
})
export class GeminiApiModule {}
