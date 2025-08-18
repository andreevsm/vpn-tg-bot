import { Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';

import { UNSUBSCRIBE_SCENE_ID } from '@common/constants/scenes.constant';
import { Texts } from '@common/texts';
import { SubscriptionPlan, SubscriptionStatus } from '@common/types';
import { SubscriberUseCase } from '@use-cases/subscriber.use-case';

import type { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import type { WizardContext } from 'telegraf/typings/scenes';

@Wizard(UNSUBSCRIBE_SCENE_ID)
export class UnsubscribeWizard {
  constructor(private subscriberUserCase: SubscriberUseCase) {}

  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext): Promise<string> {
    const nickname = ctx.message.from.username;
    const subscriber =
      this.subscriberUserCase.getSubscriberByNickname(nickname);

    if (!!subscriber) {
      if (this.subscriberUserCase.hasUsedTrial(subscriber)) {
        ctx.wizard.next();
        ctx.sendMessage(Texts.DEMO_FINISHED);
        return;
      }

      ctx.wizard.next();
      ctx.sendMessage(`Ты точно хочешь отказаться?`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Да',
                callback_data: 'yes',
              },
              {
                text: 'Нет',
                callback_data: 'no',
              },
            ],
          ],
        },
      });
      return;
    }

    await ctx.scene.leave();
    return 'У тебя еще нет подписки!';
  }

  @On('callback_query')
  @WizardStep(2)
  async onStepTwo(@Ctx() ctx: WizardContext): Promise<string> {
    await ctx.scene.leave();

    const answer = (ctx.callbackQuery as CallbackQuery.DataQuery).data;

    if (answer === 'yes') {
      const nickname = (ctx.update as any).callback_query.from.username;
      const removedSubscriber =
        this.subscriberUserCase.getSubscriberByNickname(nickname);

      if (!!removedSubscriber) {
        if (
          removedSubscriber.subscription.plan === SubscriptionPlan.TRIAL &&
          removedSubscriber.subscription.status === SubscriptionStatus.ACTIVE
        ) {
          this.subscriberUserCase.updateSubscriber({
            ...removedSubscriber,
            subscription: {
              ...removedSubscriber.subscription,
              status: SubscriptionStatus.EXPIRED,
            },
          });

          return 'Твоя Demo подписка прекращена! Надеюсь, ты вернешься снова';
        }

        this.subscriberUserCase.removeSubscriber(removedSubscriber);
        return 'Пока! Надеюсь, ты вернешься снова';
      }
    }

    if (answer === 'no') {
      return 'Здорово, это правильный выбор! ;)';
    }

    return;
  }
}
