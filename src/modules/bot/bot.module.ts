import { Module } from '@nestjs/common';

import { LogService } from '@common/logger';
import { SubscriberRepository } from '@core/repositories/subscriber.repository';
import { FileSubscriberRepository } from '@infra/file-subscriber.repository';
import { SubscriberUseCase } from '@use-cases/subscriber.use-case';

import { AdminWizard } from './admin.wizard';
import { BotUpdate } from './bot.update';
import { HelpWizard } from './help.wizard';
import { SubscriptionFsmService } from './subscription-fsm.service';
import { UnsubscribeWizard } from './unsubscribe.wizard';

@Module({
  providers: [
    BotUpdate,
    SubscriberUseCase,
    {
      provide: SubscriberRepository,
      useClass: FileSubscriberRepository,
    },
    UnsubscribeWizard,
    HelpWizard,
    AdminWizard,
    SubscriptionFsmService,
    LogService,
  ],
})
export class BotModule {}
