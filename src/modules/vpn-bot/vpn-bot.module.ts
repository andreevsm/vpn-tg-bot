import { Module } from '@nestjs/common';
import { VpnBotUpdate } from './vpn-bot.update';
import { SubscriberUseCase } from 'src/use-cases/subscriber/subscriber.use-case';
import { SubscriberRepository } from 'src/core/repositories/subscriber.repository';
import { UnsubscribeWizard } from './unsubscribe.wizard';
import { HelpWizard } from './help.wizard';
import { AdminWizard } from './admin.wizard';

@Module({
  providers: [
    VpnBotUpdate,
    SubscriberUseCase,
    SubscriberRepository,
    UnsubscribeWizard,
    HelpWizard,
    AdminWizard,
  ],
})
export class VpnBotModule {}
