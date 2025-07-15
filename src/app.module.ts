import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { BotModule } from './modules/bot/bot.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';

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
