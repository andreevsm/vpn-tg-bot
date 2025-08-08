import { Command, Ctx, Start, Update, InjectBot, On } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Context, SubscriptionPlan, SubscriptionStatus } from '@common/types';
import { Commands } from '@common/constants';
import { SUBSCRIBERS_LIMIT } from '@common/constants/subscribers-limit.constant';
import {
  UNSUBSCRIBE_SCENE_ID,
  HELP_SCENE_ID,
  ADMIN_SCENE_ID,
} from '@common/constants/scenes.constant';
import { SubscriberUseCase } from '@use-cases/subscriber/subscriber.use-case';
import { UseFilters, UseGuards } from '@nestjs/common';
import { ADMIN_NICKNAMES } from '@common/constants/admin-nicknames.constant';
import { AdminGuard } from '@common/guards/admin.guard';
import { TelegrafExceptionFilter } from '@common/filters/telegraf-exception.filter';
import { SubscriptionFsmService } from './subscription-fsm.service';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private subscriberUseCase: SubscriberUseCase,
    private subscriptionFsmService: SubscriptionFsmService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const nickname = ctx.message.from.username;

    const commands = [
      { command: Commands.START, description: 'Начать' },
      { command: Commands.SUBSCRIPTION, description: 'Подписка' },
      { command: Commands.HELP, description: 'Помощь' },
      { command: Commands.UNSUBSCRIBE, description: 'Отменить подписку' },
    ];

    if (ADMIN_NICKNAMES.includes(nickname)) {
      commands.push({
        command: Commands.ADMIN,
        description: 'Админка',
      });
    }

    await this.bot.telegram.setMyCommands(commands);

    const subscribersCount = this.subscriberUseCase
      .getSubscribers()
      .filter((sub) => sub.configName !== '').length;

    if (subscribersCount === SUBSCRIBERS_LIMIT) {
      return 'На данный момент желающих слишком много, вернусь к тебе чуть позже. Спасибо за понимание!';
    }

    const subscriber = this.subscriberUseCase.getSubscriberByNickname(nickname);

    if (!!subscriber) {
      if (subscriber.subscription.status === SubscriptionStatus.SHOULD_CHECK) {
        return `Твоя подписка на стадии проверки. Пожалуйста, подожди!`;
      }

      if (subscriber.subscription.status === SubscriptionStatus.ACTIVE) {
        return `Твоя подписка активна до: ${new Date(
          subscriber.exparedAt,
        ).toLocaleString()}`;
      }

      if (
        subscriber.subscription.plan === SubscriptionPlan.TRIAL &&
        subscriber.subscription.status === SubscriptionStatus.EXPIRED
      ) {
        ctx.sendMessage(
          `Твоя Demo подписка закончилась. Нажми /start для продления подписки`,
        );
      }
    }

    this.subscriptionFsmService.reset();
    this.subscriptionFsmService.exec(ctx);
  }

  @On('callback_query')
  async on(@Ctx() ctx: Context) {
    const answer = (ctx.callbackQuery as CallbackQuery.DataQuery).data;

    if (this.subscriptionFsmService.canTransitionTo(answer)) {
      this.subscriptionFsmService.transitionTo(ctx, answer);
      return;
    }

    return 'Не могу обработать твой запрос. Попробуй еще раз';
  }

  @Command(Commands.SUBSCRIPTION)
  async onSubscriptionCommand(@Ctx() ctx: Context) {
    const nickname = ctx.message.from.username;
    const subscriber = this.subscriberUseCase.getSubscriberByNickname(nickname);

    if (subscriber.subscription.status === SubscriptionStatus.SHOULD_CHECK) {
      return `Твоя подписка на стадии проверки. Пожалуйста, подожди!`;
    }

    if (subscriber.subscription.status === SubscriptionStatus.ACTIVE) {
      return `Твоя подписка активна до: ${new Date(
        subscriber.exparedAt,
      ).toLocaleString()}`;
    }

    if (
      subscriber.subscription.plan === SubscriptionPlan.TRIAL &&
      subscriber.subscription.status === SubscriptionStatus.EXPIRED
    ) {
      ctx.sendMessage(
        `Твоя Demo подписка закончилась. Нажми /start для продления подписки`,
      );
      return;
    }

    return 'У тебя нет подписки. Для ее оформления введи /start';
  }

  @Command(Commands.UNSUBSCRIBE)
  async onUnsubscribeCommand(@Ctx() ctx: Context): Promise<void> {
    await ctx.scene.enter(UNSUBSCRIBE_SCENE_ID);
  }

  @Command(Commands.HELP)
  async onHelpCommand(@Ctx() ctx: Context): Promise<void> {
    await ctx.scene.enter(HELP_SCENE_ID);
  }

  @Command(Commands.ADMIN)
  @UseGuards(AdminGuard)
  async onAdminCommand(@Ctx() ctx: Context): Promise<void> {
    await ctx.scene.enter(ADMIN_SCENE_ID);
  }
}
