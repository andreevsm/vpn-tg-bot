import { HELP_SCENE_ID } from '@common/constants/scenes.constant';
import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';

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

    const nickname = ctx.message.from.username;

    ctx.telegram.sendMessage(367898257, `${nickname}: ${msg.text}`);

    return 'Благодарю! Вернусь с ответом как можно скорее';
  }
}
