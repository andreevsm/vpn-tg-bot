import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { SubscriberUseCase } from 'src/use-cases/subscriber/subscriber.use-case';
import { SubscriberRepository } from 'src/core/repositories/subscriber.repository';
import { UnsubscribeWizard } from './unsubscribe.wizard';
import { HelpWizard } from './help.wizard';
import { AdminWizard } from './admin.wizard';

@Module({
  providers: [
    BotUpdate,
    SubscriberUseCase,
    SubscriberRepository,
    UnsubscribeWizard,
    HelpWizard,
    AdminWizard,
  ],
})
export class BotModule {}
