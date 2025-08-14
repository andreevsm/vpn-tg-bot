import { FSM } from '@common/fsm';
import { Injectable } from '@nestjs/common';
import { BOT_CONFIG, SUBSCRIPTION_STATE } from './bot.config';
import { SubscriberUseCase } from '@use-cases/subscriber/subscriber.use-case';
import { BotActions } from '@common/enums/bot-actions.enum';
import { Context, SubscriptionPlan, SubscriptionStatus } from '@common/types';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { Texts } from '@common/texts';

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
    [BotActions.EXCELLENT]: async (ctx, message) => {
      const userInfo = ctx.callbackQuery.from;
      const nickname = userInfo?.username;
      const subscriber =
        this.subscriberUseCase.getSubscriberByNickname(nickname);

      const hasAlreadyUsedTrial =
        subscriber.subscription.plan === SubscriptionPlan.TRIAL &&
        subscriber.subscription.status === SubscriptionStatus.EXPIRED;

      const messageData = {
        ...message.data,
      };

      if (!hasAlreadyUsedTrial) {
        messageData.reply_markup.inline_keyboard[0].push({
          text: 'Demo режим',
          callback_data: BotActions.DEMO_SUBSCRIPTION,
        });
      }

      console.log('messageData', messageData.reply_markup.inline_keyboard);

      ctx.sendMessage(message.text, messageData);
    },
    [BotActions.DEMO_SUBSCRIPTION]: async (ctx, message) => {
      const userInfo = ctx.callbackQuery.from;
      const nickname = userInfo?.username;
      const subscriber =
        this.subscriberUseCase.getSubscriberByNickname(nickname);

      if (!!subscriber) {
        if (this.subscriberUseCase.hasUsedTrial(subscriber)) {
          ctx.sendMessage(Texts.DEMO_FINISHED);
          return;
        }
      }

      ctx.session['plan'] = SubscriptionPlan.TRIAL;
      ctx.session['status'] = SubscriptionStatus.ACTIVE;

      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.APP_DOWNLOADED]: async (ctx, message) => {
      const userInfo = ctx.callbackQuery.from;
      const nickname = userInfo?.username;

      const status = ctx.session['status'];
      const plan = ctx.session['plan'];

      const currentTime = +new Date();
      const oneDay = 24 * 60 * 60 * 1000;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const oneDayExpiredAtTime = currentTime + oneDay;
      const thirtyDaysExpiredAtTime = currentTime + thirtyDays;

      const exparedAt =
        plan === SubscriptionPlan.MONTH
          ? thirtyDaysExpiredAtTime
          : oneDayExpiredAtTime;

      ctx.telegram.sendMessage(367898257, `${nickname}: Проверь подписку`);

      const subscriber =
        this.subscriberUseCase.getSubscriberByNickname(nickname);

      if (!!subscriber && subscriber.configName !== '') {
        await ctx.telegram.sendDocument(ctx.chat.id, {
          source: `vpn-configs/${subscriber.configName}.conf`,
        });
        ctx.sendMessage('Вижу, что у тебя уже есть файл с настройками!');
        this.subscriberUseCase.updateSubscriber({
          ...subscriber,
          exparedAt,
          subscription: {
            plan,
            status,
          },
        });

        ctx.session['plan'] = undefined;
        ctx.session['status'] = undefined;

        return;
      }

      const subscribersCount = this.subscriberUseCase
        .getSubscribers()
        .filter((sub) => sub.configName !== '').length;

      const fileName = `anse-vpn-bot-${subscribersCount + 1}`;
      console.log('fileName', fileName);

      await ctx.telegram.sendDocument(ctx.chat.id, {
        source: `vpn-configs/${fileName}.conf`,
      });

      if (!!subscriber) {
        this.subscriberUseCase.updateSubscriber({
          ...subscriber,
          createdAt: currentTime,
          exparedAt,
          configName: `anse-vpn-bot-${subscribersCount + 1}`,
          subscription: {
            plan,
            status,
          },
        });
      } else {
        this.subscriberUseCase.addSubscriber({
          id: userInfo.id,
          firstName: userInfo['first_name'],
          nickname,
          createdAt: currentTime,
          exparedAt,
          configName: `anse-vpn-bot-${subscribersCount + 1}`,
          subscription: {
            plan,
            status,
          },
        });
      }

      ctx.session['plan'] = undefined;
      ctx.session['status'] = undefined;

      const timeoutId = setTimeout(() => {
        const subscriber =
          this.subscriberUseCase.getSubscriberByNickname(nickname);

        if (
          subscriber.subscription.plan === SubscriptionPlan.TRIAL &&
          subscriber.subscription.status === SubscriptionStatus.ACTIVE
        ) {
          const subscriberWithExpiredTrial = {
            ...subscriber,
            configName: '',
            subscription: {
              plan: SubscriptionPlan.TRIAL,
              status: SubscriptionStatus.EXPIRED,
            },
          };

          this.subscriberUseCase.updateSubscriber(subscriberWithExpiredTrial);
          ctx.sendMessage(Texts.DEMO_FINISHED);
        }
      }, oneDay);

      this.schedulerRegistry.addTimeout(
        `trial-exprided-${nickname}`,
        timeoutId,
      );

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
      ctx.session['plan'] = SubscriptionPlan.MONTH;
      ctx.session['status'] = SubscriptionStatus.SHOULD_CHECK;

      ctx.sendMessage(message.text, message.data);
    },
    [BotActions.PAY_DONE]: async (ctx, message) => {
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

  public canTransitionTo(currentValue: string): boolean {
    return this.fsm.canTransitionTo(currentValue);
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
