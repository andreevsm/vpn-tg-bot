import { join } from 'path';

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';

import { BotModule } from './modules/bot/bot.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TelegrafModule.forRootAsync({
      useFactory: () => ({
        token: process.env.TG_BOT_KEY,
        middlewares: [session()],
        include: [BotModule],
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    BotModule,
  ],
})
export class AppModule {}
