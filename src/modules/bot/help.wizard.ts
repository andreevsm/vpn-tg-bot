import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';

import { HELP_SCENE_ID } from '@common/constants/scenes.constant';
import { isCommand } from '@common/is-command';

import type { WizardContext } from 'telegraf/typings/scenes';

@Wizard(HELP_SCENE_ID)
export class HelpWizard {
  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext): Promise<string> {
    ctx.wizard.next();
    return 'Напиши свой вопрос';
  }

  @On('text')
  @WizardStep(2)
  async onStepTwo(
    @Ctx() ctx: WizardContext,
    @Message() msg: { text: string },
  ): Promise<string> {
    await ctx.scene.leave();

    if (isCommand(msg.text)) {
      return;
    }

    const nickname = ctx.message.from.username;

    ctx.telegram.sendMessage(367898257, `${nickname}: ${msg.text}`);

    return 'Благодарю! Вернусь с ответом как можно скорее';
  }
}
