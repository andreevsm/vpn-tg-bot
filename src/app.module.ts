import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { VpnBotModule } from './modules/vpn-bot/vpn-bot.module';
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
        include: [VpnBotModule],
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    VpnBotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
