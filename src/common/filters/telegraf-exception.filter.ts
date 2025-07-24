import { LogService } from '@common/log.service';
import { Context } from '@common/types';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  constructor(private logService: LogService) {}

  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<Context>();

    this.logService.error(exception.message, exception.stack);

    await ctx.replyWithHTML(`<b>Error</b>: ${exception.message}`);
  }
}
