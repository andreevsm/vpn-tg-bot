import { Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';

import { ADMIN_SCENE_ID } from '@common/constants/scenes.constant';
import { SubscriptionPlan, SubscriptionStatus } from '@common/types';
import { SubscriberUseCase } from '@use-cases/subscriber.use-case';

import type { SceneContext } from 'telegraf/typings/scenes';

@Scene(ADMIN_SCENE_ID)
export class AdminWizard {
  constructor(private readonly subscriberUseCase: SubscriberUseCase) {}

  @SceneEnter()
  async enter(@Ctx() ctx: SceneContext) {
    await ctx.reply(
      'Выберите действие:',
      Markup.inlineKeyboard([
        Markup.button.callback('Список пользователей', 'all_users'),
        Markup.button.callback(
          '➕ Подтвердить проверку пользователя',
          'add_user',
        ),
        Markup.button.callback('🗑 Удалить пользователя', 'delete_user'),
      ]),
    );
  }

  @On('callback_query')
  async onAction(@Ctx() ctx: SceneContext) {
    const action = (ctx.update as any).callback_query.data;

    ctx.answerCbQuery();

    if (action === 'all_users') {
      const subscribers = this.subscriberUseCase
        .getSubscribers()
        .map((subscriber) => subscriber.nickname)
        .join(' ');

      await ctx.reply(subscribers);

      await ctx.scene.leave();
      return;
    }

    if (action === 'add_user' || action === 'delete_user') {
      ctx.scene.session.state = {
        action,
      };

      await ctx.reply('Введите никнейм:');
    }
  }

  @On('text')
  async onNickname(@Ctx() ctx: SceneContext) {
    const action = (ctx.scene.session.state as any).action;
    const nickname = (ctx.update as any).message.text as string;
    const subscriber = this.subscriberUseCase.getSubscriberByNickname(nickname);

    await ctx.scene.leave();

    if (action === 'add_user') {
      this.subscriberUseCase.updateSubscriber({
        ...subscriber,
        exparedAt: Date.now(),
        subscription: {
          status: SubscriptionStatus.ACTIVE,
          plan: SubscriptionPlan.MONTH,
        },
      });
      await ctx.reply(`Пользователь с ником ${nickname} проверен`);

      return;
    }

    if (action === 'delete_user') {
      this.subscriberUseCase.removeSubscriber(subscriber);
      await ctx.reply(`Пользователь с ником ${nickname} удален`);

      return;
    }
  }
}
