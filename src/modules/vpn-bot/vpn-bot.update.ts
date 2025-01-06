import { Command, Ctx, Start, Update, InjectBot, On } from 'nestjs-telegraf';
import { Context, Scenes, Telegraf } from 'telegraf';
import { Subscriber, SubscriptionPlan, SubscriptionStatus } from 'src/types';
import { SubscriberUseCase } from 'src/use-cases/subscriber/subscriber.use-case';
import { Commands } from 'src/common/constants';
import { HELP_SCENE_ID, UNSUBSCRIBE_SCENE_ID } from 'src/app.constants';

@Update()
export class VpnBotUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private subscriberUserCase: SubscriberUseCase,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Scenes.SceneContext) {
    await this.bot.telegram.setMyCommands([
      { command: Commands.START, description: 'Начать' },
      { command: Commands.SUBSCRIPTION, description: 'Подписка' },
      { command: Commands.HELP, description: 'Помощь' },
      { command: Commands.UNSUBSCRIBE, description: 'Отменить подписку' },
    ]);

    const nickname = ctx.message.from.username;

    const subscriber =
      this.subscriberUserCase.getSubscriberByNickname(nickname);

    if (!!subscriber) {
      return `Твоя подписка активна до: ${new Date(
        subscriber.exparedAt,
      ).toLocaleString()}`;
    }

    const hasUsedTrialUsers = this.subscriberUserCase
      .getSubscribers()
      .filter(
        (sub) =>
          sub.subscription.plan === SubscriptionPlan.TRIAL &&
          sub.subscription.status === SubscriptionStatus.EXPIRED,
      );

    const hasUsedTrialUser = hasUsedTrialUsers.find(
      (subscriber) => subscriber.nickname === nickname,
    );

    if (!!hasUsedTrialUser) {
      ctx.sendMessage(
        `У тебя закончился Demo режим. Если тебя все устроило, то ты можешь оплатить подписку.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Оплатить',
                  callback_data: 'pay_now',
                },
              ],
            ],
          },
        },
      );

      return;
    }

    ctx.sendMessage(
      'Привет! Меня зовут ANSE VPN Bot и я помогу тебе за 2 шага настроить VPN',
      {
        reply_markup: {
          one_time_keyboard: true,
          inline_keyboard: [
            [
              {
                text: 'Отлично!',
                callback_data: 'excellent',
              },
            ],
          ],
        },
      },
    );
  }

  @On('callback_query')
  async on(@Ctx() ctx: Scenes.SceneContext) {
    const answer = (ctx.update as any).callback_query.data;

    if (answer === 'excellent') {
      ctx.sendMessage(
        `
        Перед тем, как мы продолжим, важно сказать.
        \nПодписка на меня стоит 200 рублей в месяц. Помимо этого у тебя будет возможность использовать demo режим и целые 24 часа пользоваться VPN бесплатно.
        \nЯ очень хочу, чтобы ты на 100% убедился в скорости работы VPN`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Demo режим',
                  callback_data: 'demo_subscription',
                },
                {
                  text: 'Оплатить сейчас',
                  callback_data: 'pay_now',
                },
              ],
            ],
          },
        },
      );

      return;
    }

    if (answer === 'demo_subscription') {
      ctx.sendMessage(
        `Для начала скачай приложение WireGuard, оно доступно в Google Play (https://play.google.com/store/apps/details?id=com.wireguard.android&hl=ru) и App Store (https://apps.apple.com/ru/app/wireguard/id1441195209). Если хочешь использовать VPN на компьютере, то можешь скачать приложение из официального сайта https://www.wireguard.com/install/
      `,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'app_downloaded',
                },
              ],
            ],
          },
        },
      );

      return;
    }

    if (answer === 'app_downloaded') {
      const userInfo = (ctx.update as any).callback_query.from;

      const subscriber = this.subscriberUserCase.getSubscriberByNickname(
        userInfo.username,
      );

      if (
        !!subscriber &&
        subscriber.subscription.plan === SubscriptionPlan.TRIAL &&
        subscriber.subscription.status === SubscriptionStatus.ACTIVE
      ) {
        return `Твоя подписка активна до: ${new Date(
          subscriber.exparedAt,
        ).toLocaleString()}`;
      }

      const subscribersCount = this.subscriberUserCase.getSubscribers().length;

      this.subscriberUserCase.addSubscriber({
        id: userInfo.id,
        firstName: userInfo['first_name'],
        nickname: userInfo.username,
        createdAt: +new Date(),
        exparedAt: +new Date() + 24 * 60 * 60 * 1000,
        configName: `anse-vpn-bot-${subscribersCount + 1}`,
        subscription: {
          plan: SubscriptionPlan.TRIAL,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      ctx.telegram.sendDocument(ctx.chat.id, {
        source: `vpn-configs/anse-vpn-bot-${subscribersCount + 1}.conf`,
      });

      ctx.sendMessage(
        `Отлично! Вот файлик с настройками. Сохрани его на своем устройстве`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'file_downloaded',
                },
              ],
            ],
          },
        },
      );

      return;
    }

    if (answer === 'file_downloaded') {
      ctx.sendMessage(`Теперь укажи свое устройство`, {
        reply_markup: {
          one_time_keyboard: true,
          inline_keyboard: [
            [
              {
                text: 'Android',
                callback_data: 'android',
              },
              {
                text: 'IPhone',
                callback_data: 'iphone',
              },
              {
                text: 'Windows',
                callback_data: 'windows',
              },
              {
                text: 'Mac',
                callback_data: 'macos',
              },
            ],
          ],
        },
      });

      return;
    }

    if (answer === 'android') {
      ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });
      ctx.sendMessage(
        `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'config_added_to_wireguard',
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (answer === 'iphone') {
      ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });
      ctx.sendMessage(
        `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'config_added_to_wireguard',
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (answer === 'windows') {
      ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });
      ctx.sendMessage(
        `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'config_added_to_wireguard',
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (answer === 'macos') {
      ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });
      ctx.sendMessage(
        `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'config_added_to_wireguard',
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (answer === 'config_added_to_wireguard') {
      const nickname = (ctx.update as any).callback_query.from.username;

      const subscriber = this.subscriberUserCase
        .getSubscribers()
        .find(
          (sub) =>
            sub.nickname === nickname &&
            sub.subscription.plan === SubscriptionPlan.MONTH &&
            (sub.subscription.status === SubscriptionStatus.SHOULD_CHECK ||
              sub.subscription.status === SubscriptionStatus.ACTIVE),
        );

      if (!!subscriber) {
        return `Поздравляю! Теперь ты можешь без проблем смотреть Reels и Shorts целый месяц`;
      }

      const trialSubscribers = this.subscriberUserCase
        .getSubscribers()
        .filter(
          (sub) =>
            sub.subscription.plan === SubscriptionPlan.TRIAL &&
            sub.subscription.status === SubscriptionStatus.ACTIVE,
        );

      const trialSubscriber: Subscriber | undefined = trialSubscribers.find(
        (subscriber) => subscriber.nickname === nickname,
      );

      if (!!trialSubscriber) {
        return `Поздравляю! Теперь ты можешь без проблем смотреть Reels и Shorts, но не забывай, что ровно через 24 часа demo режим закончится`;
      }
    }

    if (answer === 'pay_now') {
      ctx.sendMessage(
        `Переведи на номер карты 5536 9137 5110 3132 сумму 200 руб.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'pay_done',
                },
              ],
            ],
          },
        },
      );

      return;
    }

    if (answer === 'pay_done') {
      const userInfo = (ctx.update as any).callback_query.from;

      this.subscriberUserCase.addSubscriber({
        id: userInfo.id,
        firstName: userInfo['first_name'],
        nickname: userInfo.username,
        createdAt: +new Date(),
        exparedAt: +new Date() + 30 * 24 * 60 * 60 * 1000,
        configName: `anse-vpn-bot-${
          this.subscriberUserCase.getSubscribers().length + 1
        }`,
        subscription: {
          plan: SubscriptionPlan.MONTH,
          status: SubscriptionStatus.SHOULD_CHECK,
        },
      });

      ctx.sendMessage(
        `Отлично! Я проверю твой платеж, а пока скачай приложение WireGuard, оно доступно в Google Play (https://play.google.com/store/apps/details?id=com.wireguard.android&hl=ru) и App Store (https://apps.apple.com/ru/app/wireguard/id1441195209). Если хочешь использовать VPN на компьютере, то можешь скачать приложение из официального сайта https://www.wireguard.com/install/
        `,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'app_downloaded_subscription',
                },
              ],
            ],
          },
        },
      );

      return;
    }

    if (answer === 'app_downloaded_subscription') {
      const userInfo = (ctx.update as any).callback_query.from;

      const subscriber = this.subscriberUserCase.getSubscriberByNickname(
        userInfo.username,
      );

      ctx.telegram.sendDocument(ctx.chat.id, {
        source: `vpn-configs/${subscriber.configName}.conf`,
      });

      ctx.sendMessage(
        `Отлично! Вот файлик с настройками. Сохрани его на своем устройстве`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'file_downloaded_subscription',
                },
              ],
            ],
          },
        },
      );

      return;
    }

    if (answer === 'file_downloaded_subscription') {
      ctx.sendMessage(`3️⃣ Теперь укажи свое устройство`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Android',
                callback_data: 'android_subscription',
              },
              {
                text: 'IPhone',
                callback_data: 'iphone_subscription',
              },
              {
                text: 'Windows',
                callback_data: 'windows_subscription',
              },
              {
                text: 'Mac',
                callback_data: 'macos_subscription',
              },
            ],
          ],
        },
      });

      return;
    }

    if (answer === 'android_subscription') {
      ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });
      ctx.sendMessage(
        `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'config_added_to_wireguard_subscription',
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (answer === 'iphone_subscription') {
      ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });
      ctx.sendMessage(
        `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'config_added_to_wireguard_subscription',
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (answer === 'windows_subscription') {
      ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });
      ctx.sendMessage(
        `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'config_added_to_wireguard_subscription',
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (answer === 'macos_subscription') {
      ctx.replyWithPhoto({
        source: `${process.cwd()}/public/wire_guard_ios.jpeg`,
      });
      ctx.sendMessage(
        `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Готово',
                  callback_data: 'config_added_to_wireguard_subscription',
                },
              ],
            ],
          },
        },
      );
      return;
    }

    if (answer === 'config_added_to_wireguard_subscription') {
      const nickname = (ctx.update as any).callback_query.from.username;

      const subscriber =
        this.subscriberUserCase.getSubscriberByNickname(nickname);

      if (!!subscriber) {
        return `Поздравляю! Теперь ты можешь без проблем смотреть Reels и Shorts целый месяц`;
      }

      const trialSubscribers = this.subscriberUserCase
        .getSubscribers()
        .filter(
          (sub) =>
            sub.subscription.plan === SubscriptionPlan.TRIAL &&
            sub.subscription.status === SubscriptionStatus.ACTIVE,
        );
      const trialSubscriber: Subscriber | undefined = trialSubscribers.find(
        (subscriber) => subscriber.nickname === nickname,
      );

      if (!!trialSubscriber) {
        return `Поздравляю! Теперь ты можешь без проблем смотреть Reels и Shorts, но не забывай, что ровно через 24 часа demo режим закончится`;
      }
    }

    if (answer === 'unsubscribe_yes') {
      const nickname = (ctx.update as any).callback_query.from.username;

      const removedSubscriber =
        this.subscriberUserCase.getSubscriberByNickname(nickname);

      if (!!removedSubscriber) {
        this.subscriberUserCase.removeSubscriber(removedSubscriber);
        return 'Пока! Надеюсь, что ты вернешься снова';
      }
    }

    if (answer === 'unsubscribe_no') {
      return 'Благодарю!';
    }

    if (answer === 'unsubscribe_trial_yes') {
      const nickname = (ctx.update as any).callback_query.from.username;
      const trialSubscribers = this.subscriberUserCase
        .getSubscribers()
        .filter(
          (sub) =>
            sub.subscription.plan === SubscriptionPlan.TRIAL &&
            sub.subscription.status === SubscriptionStatus.ACTIVE,
        );
      const removedSubscriber = trialSubscribers.find(
        (subscriber) => subscriber.nickname === nickname,
      );

      if (!!removedSubscriber) {
        this.subscriberUserCase.removeSubscriber(removedSubscriber);
        return 'Пока! Надеюсь, что ты вернешься снова';
      }
    }

    if (answer === 'unsubscribe_trial_no') {
      return 'Благодарю!';
    }

    return 'Нет такого ответа';
  }

  @Command(Commands.SUBSCRIPTION)
  async onSubscriptionCommand(@Ctx() ctx: Scenes.SceneContext) {
    const nickname = ctx.message.from.username;
    const subscriber =
      this.subscriberUserCase.getSubscriberByNickname(nickname);

    if (!!subscriber) {
      return `Твоя подписка активна до: ${new Date(
        subscriber.exparedAt,
      ).toLocaleString()}`;
    }

    return 'У тебя нет подписки. Для ее оформления введи /start';
  }

  @Command(Commands.UNSUBSCRIBE)
  async onUnsubscribeCommand(@Ctx() ctx: Scenes.SceneContext): Promise<void> {
    await ctx.scene.enter(UNSUBSCRIBE_SCENE_ID);
  }

  @Command(Commands.HELP)
  async onHelpCommand(@Ctx() ctx: Scenes.SceneContext): Promise<void> {
    await ctx.scene.enter(HELP_SCENE_ID);
  }
}
