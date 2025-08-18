import { NestFactory } from '@nestjs/core';
import { getBotToken } from 'nestjs-telegraf';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const bot = app.get(getBotToken());
  app.use(bot.webhookCallback('/secret-path'));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
