import { FSM } from '@common/fsm';
import { Injectable } from '@nestjs/common';
import { BOT_CONFIG, SUBSCRIPTION_STATE } from './bot.config';
import { SubscriberUseCase } from '@use-cases/subscriber/subscriber.use-case';
import { BotActions } from '@common/enums/bot-actions.enum';
import { Context, SubscriptionPlan, SubscriptionStatus } from '@common/types';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

@Injectable()
export class SubscriptionFsmService {
  private fsm = new FSM(SUBSCRIPTION_STATE);

  handlers: Record<
    BotActions,
    (
      ctx: Context,
      message?: { text: string; data?: ExtraReplyMessage | any },
    ) => Promise<string | void>
  > = {
    [BotActions.START]: async (ctx, message) => {
      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.FINISH]: async () => {},
    [BotActions.EXCELLENT]: async (ctx, message) => {
      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.DEMO_SUBSCRIPTION]: async (ctx, message) => {
      const userInfo = ctx.callbackQuery.from;
      const nickname = userInfo?.username;

      const subscriber =
        this.subscriberUseCase.getSubscriberByNickname(nickname);

      if (
        subscriber?.subscription.plan === SubscriptionPlan.TRIAL &&
        subscriber?.subscription.status === SubscriptionStatus.ACTIVE
      ) {
        return `Твоя подписка активна до: ${new Date(
          subscriber.exparedAt,
        ).toLocaleString()}`;
      }

      const subscribersCount = this.subscriberUseCase
        .getSubscribers()
        .filter((sub) => sub.configName !== '').length;

      const currentTime = +new Date();
      const oneDay = 24 * 60 * 60 * 1000;
      const expiredAtTime = currentTime + oneDay;

      this.subscriberUseCase.addSubscriber({
        id: userInfo.id,
        firstName: userInfo['first_name'],
        nickname,
        createdAt: currentTime,
        exparedAt: expiredAtTime,
        configName: `anse-vpn-bot-${subscribersCount + 1}`,
        subscription: {
          plan: SubscriptionPlan.TRIAL,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      const timeoutId = setTimeout(() => {
        const subscriber =
          this.subscriberUseCase.getSubscriberByNickname(nickname);

        const subscriberWithExpiredTrial = {
          ...subscriber,
          configName: '',
          subscription: {
            plan: SubscriptionPlan.TRIAL,
            status: SubscriptionStatus.EXPIRED,
          },
        };

        this.subscriberUseCase.updateSubscriber(subscriberWithExpiredTrial);
        ctx.sendMessage('Твоя демо подписка закончилась!');
      }, oneDay);

      this.schedulerRegistry.addTimeout('trial-exprided', timeoutId);

      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.APP_DOWNLOADED]: async (ctx, message) => {
      const subscribersCount = this.subscriberUseCase
        .getSubscribers()
        .filter((sub) => sub.configName !== '').length;

      await ctx.telegram.sendDocument(ctx.chat.id, {
        source: `vpn-configs/anse-vpn-bot-${subscribersCount}.conf`,
      });

      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.FILE_DOWNLOADED]: async (ctx, message) => {
      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.ANDROID]: async (ctx, message) => {
      await ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });

      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.IOS]: async (ctx, message) => {
      await ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });

      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.MACOS]: async (ctx, message) => {
      await ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });

      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.WINDOWS]: async (ctx, message) => {
      await ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });

      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.CONFIG_ADDED]: async (ctx, message) => {
      const userInfo = ctx.callbackQuery.from;
      const nickname = userInfo?.username;

      const subscriber = this.subscriberUseCase
        .getSubscribers()
        .find(
          (sub) =>
            sub.nickname === nickname &&
            sub.subscription.plan === SubscriptionPlan.MONTH &&
            (sub.subscription.status === SubscriptionStatus.SHOULD_CHECK ||
              sub.subscription.status === SubscriptionStatus.ACTIVE),
        );

      if (subscriber) {
        ctx.sendMessage(message.text);
        return;
      }

      const trialSubscriber = this.subscriberUseCase
        .getSubscribers()
        .find(
          (sub) =>
            sub.nickname === nickname &&
            sub.subscription.plan === SubscriptionPlan.TRIAL &&
            sub.subscription.status === SubscriptionStatus.ACTIVE,
        );

      if (trialSubscriber) {
        ctx.sendMessage(
          `Поздравляю! Теперь ты можешь использовать VPN, но не забывай, что через 24 часа demo режим закончится`,
        );
        return;
      }
    },
    [BotActions.PAY_NOW]: async (ctx, message) => {
      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.PAY_DONE]: async (ctx, message) => {
      const userInfo = ctx.callbackQuery.from;
      const nickname = userInfo?.username;

      this.subscriberUseCase.addSubscriber({
        id: userInfo.id,
        firstName: userInfo['first_name'],
        nickname,
        createdAt: +new Date(),
        exparedAt: +new Date() + 30 * 24 * 60 * 60 * 1000,
        configName: `anse-vpn-bot-${
          this.subscriberUseCase.getSubscribers().length + 1
        }`,
        subscription: {
          plan: SubscriptionPlan.MONTH,
          status: SubscriptionStatus.SHOULD_CHECK,
        },
      });

      ctx.sendMessage(message.text, message.data);
    },
  };

  constructor(
    private subscriberUseCase: SubscriberUseCase,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  public transitionTo(ctx: Context, currentValue: string): void {
    this.fsm.transitionTo(currentValue);

    const value = BOT_CONFIG[this.getValue()];
    this.handlers[this.getValue()]?.(ctx, value);
  }

  public getValue(): string {
    return this.fsm.getValue();
  }

  public reset() {
    this.fsm.reset();
  }

  public exec(ctx: Context) {
    const value = BOT_CONFIG[this.getValue()];

    this.handlers[this.getValue()]?.(ctx, value);
  }
}
