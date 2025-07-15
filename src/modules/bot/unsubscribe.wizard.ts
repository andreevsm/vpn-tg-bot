import { Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { UNSUBSCRIBE_SCENE_ID } from '../../app.constants';
import { WizardContext } from 'telegraf/typings/scenes';
import { SubscriberUseCase } from '@use-cases/subscriber/subscriber.use-case';

@Wizard(UNSUBSCRIBE_SCENE_ID)
export class UnsubscribeWizard {
  constructor(private subscriberUserCase: SubscriberUseCase) {}

  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext): Promise<string> {
    const nickname = ctx.message.from.username;
    const subscriber =
      this.subscriberUserCase.getSubscriberByNickname(nickname);

    if (!!subscriber) {
      await ctx.wizard.next();

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
    return 'Ты еще не оформил подписку!';
  }

  @On('callback_query')
  @WizardStep(2)
  async onStepTwo(@Ctx() ctx: WizardContext): Promise<string> {
    await ctx.scene.leave();

    const answer = (ctx.update as any).callback_query.data;

    if (answer === 'yes') {
      const nickname = (ctx.update as any).callback_query.from.username;
      const removedSubscriber =
        this.subscriberUserCase.getSubscriberByNickname(nickname);

      if (!!removedSubscriber) {
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
