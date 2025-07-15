import { Command, Ctx, Start, Update, InjectBot, On } from 'nestjs-telegraf';
import { Context, Scenes, Telegraf } from 'telegraf';
import { SubscriptionPlan, SubscriptionStatus } from '@common/types';
import { Commands } from '@common/constants';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SUBSCRIBERS_LIMIT } from '@common/constants/subscribers-limit.constant';
import {
  UNSUBSCRIBE_SCENE_ID,
  HELP_SCENE_ID,
  ADMIN_SCENE_ID,
} from '@common/constants/scenes.constant';
import { SubscriberUseCase } from '@use-cases/subscriber/subscriber.use-case';
import { UseGuards } from '@nestjs/common';
import { ADMIN_IDS } from '@common/constants/admin-ids.constant';
import { AdminGuard } from '@common/guards/admin.guard';

@Update()
export class BotUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private subscriberUserCase: SubscriberUseCase,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Scenes.SceneContext) {
    console.log(ctx.message.from);

    const nickname = ctx.message.from.username;
    const userId = ctx.message.from.id;

    const commands = [
      { command: Commands.START, description: 'Начать' },
      { command: Commands.SUBSCRIPTION, description: 'Подписка' },
      { command: Commands.HELP, description: 'Помощь' },
      { command: Commands.UNSUBSCRIBE, description: 'Отменить подписку' },
    ];

    if (ADMIN_IDS.includes(userId)) {
      commands.push({
        command: Commands.ADMIN,
        description: 'Админка',
      });
    }

    await this.bot.telegram.setMyCommands(commands);

    const subscribersCount = this.subscriberUserCase
      .getSubscribers()
      .filter((sub) => sub.configName !== '').length;

    if (subscribersCount === SUBSCRIBERS_LIMIT) {
      return 'На данный момент желающих слишком много, вернусь к тебе чуть позже. Спасибо за понимание!';
    }

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
    const userInfo = (ctx.update as any).callback_query.from;
    const nickname = userInfo?.username;

    const handlers = {
      excellent: () => {
        ctx.sendMessage(
          `
          Перед тем, как мы продолжим, важно сказать.
          \nПодписка на меня стоит 200 рублей в месяц. Помимо этого у тебя будет возможность использовать demo режим и целых 24 часа пользоваться VPN бесплатно.
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
      },

      demo_subscription: () => {
        ctx.sendMessage(
          `Для начала скачай приложение WireGuard, оно доступно в [Google Play](https://play.google.com/store/apps/details?id=com.wireguard.android&hl=ru) и [App Store](https://apps.apple.com/ru/app/wireguard/id1441195209)
Если хочешь использовать VPN на компьютере, то можешь скачать приложение с [официального сайта](https://www.wireguard.com/install/)`,
          {
            parse_mode: 'MarkdownV2',
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
      },

      app_downloaded: async () => {
        const subscriber =
          this.subscriberUserCase.getSubscriberByNickname(nickname);

        if (
          subscriber?.subscription.plan === SubscriptionPlan.TRIAL &&
          subscriber?.subscription.status === SubscriptionStatus.ACTIVE
        ) {
          return `Твоя подписка активна до: ${new Date(
            subscriber.exparedAt,
          ).toLocaleString()}`;
        }

        const subscribersCount = this.subscriberUserCase
          .getSubscribers()
          .filter((sub) => sub.configName !== '').length;

        const currentTime = +new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const expiredAtTime = currentTime + oneDay;

        this.subscriberUserCase.addSubscriber({
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
            this.subscriberUserCase.getSubscriberByNickname(nickname);

          const subscriberWithExpiredTrial = {
            ...subscriber,
            configName: '',
            subscription: {
              plan: SubscriptionPlan.TRIAL,
              status: SubscriptionStatus.EXPIRED,
            },
          };

          this.subscriberUserCase.updateSubscriber(subscriberWithExpiredTrial);
          ctx.sendMessage('Твоя демо подписка закончилась!');
        }, oneDay);

        this.schedulerRegistry.addTimeout('trial-exprided', timeoutId);

        await ctx.telegram.sendDocument(ctx.chat.id, {
          source: `vpn-configs/anse-vpn-bot-${subscribersCount + 1}.conf`,
        });

        ctx.sendMessage(
          `Отлично! Вот файл с настройками. Сохрани его на своем устройстве`,
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
      },

      file_downloaded: () => {
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
      },

      android: async () => {
        await ctx.replyWithPhoto({
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
      },

      iphone: async () => {
        await ctx.replyWithPhoto({
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
      },

      windows: async () => {
        await ctx.replyWithPhoto({
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
      },

      macos: async () => {
        await ctx.replyWithPhoto({
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
      },

      config_added_to_wireguard: () => {
        const subscriber = this.subscriberUserCase
          .getSubscribers()
          .find(
            (sub) =>
              sub.nickname === nickname &&
              sub.subscription.plan === SubscriptionPlan.MONTH &&
              (sub.subscription.status === SubscriptionStatus.SHOULD_CHECK ||
                sub.subscription.status === SubscriptionStatus.ACTIVE),
          );

        if (subscriber) {
          return `Поздравляю! Теперь ты можешь использовать VPN целый месяц`;
        }

        const trialSubscriber = this.subscriberUserCase
          .getSubscribers()
          .find(
            (sub) =>
              sub.nickname === nickname &&
              sub.subscription.plan === SubscriptionPlan.TRIAL &&
              sub.subscription.status === SubscriptionStatus.ACTIVE,
          );

        if (trialSubscriber) {
          return `Поздравляю! Теперь ты можешь использовать VPN, но не забывай, что через 24 часа demo режим закончится`;
        }
      },

      pay_now: () => {
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
      },

      pay_done: () => {
        this.subscriberUserCase.addSubscriber({
          id: userInfo.id,
          firstName: userInfo['first_name'],
          nickname,
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
      },

      app_downloaded_subscription: async () => {
        const subscriber =
          this.subscriberUserCase.getSubscriberByNickname(nickname);

        await ctx.telegram.sendDocument(ctx.chat.id, {
          source: `vpn-configs/${subscriber.configName}.conf`,
        });

        ctx.sendMessage(
          `Отлично! Вот файл с настройками. Сохрани его на своем устройстве`,
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
      },

      file_downloaded_subscription: () => {
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
      },

      android_subscription: async () => {
        await ctx.replyWithPhoto({
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
      },

      iphone_subscription: async () => {
        await ctx.replyWithPhoto({
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
      },

      windows_subscription: async () => {
        await ctx.replyWithPhoto({
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
      },

      macos_subscription: async () => {
        await ctx.replyWithPhoto({
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
      },

      config_added_to_wireguard_subscription: () => {
        const subscriber =
          this.subscriberUserCase.getSubscriberByNickname(nickname);

        if (subscriber) {
          return `Поздравляю! Теперь ты можешь без проблем смотреть Reels и Shorts целый месяц`;
        }

        const trialSubscriber = this.subscriberUserCase
          .getSubscribers()
          .find(
            (sub) =>
              sub.nickname === nickname &&
              sub.subscription.plan === SubscriptionPlan.TRIAL &&
              sub.subscription.status === SubscriptionStatus.ACTIVE,
          );

        if (trialSubscriber) {
          return `Поздравляю! Теперь ты можешь без проблем смотреть Reels и Shorts, но не забывай, что ровно через 24 часа demo режим закончится`;
        }
      },

      unsubscribe_yes: () => {
        const removedSubscriber =
          this.subscriberUserCase.getSubscriberByNickname(nickname);

        if (removedSubscriber) {
          this.subscriberUserCase.removeSubscriber(removedSubscriber);
          return 'Пока! Надеюсь, что ты вернешься снова';
        }
      },

      unsubscribe_no: () => {
        return 'Благодарю!';
      },

      unsubscribe_trial_yes: () => {
        const removedSubscriber = this.subscriberUserCase
          .getSubscribers()
          .find(
            (sub) =>
              sub.nickname === nickname &&
              sub.subscription.plan === SubscriptionPlan.TRIAL &&
              sub.subscription.status === SubscriptionStatus.ACTIVE,
          );

        if (removedSubscriber) {
          this.subscriberUserCase.removeSubscriber(removedSubscriber);
          return 'Пока! Надеюсь, что ты вернешься снова';
        }
      },

      unsubscribe_trial_no: () => {
        return 'Благодарю!';
      },
    };

    const handler = handlers[answer];

    if (!handler) {
      return 'Нет такого ответа';
    }

    return handler();
  }

  // @On('text')
  // async onText() {
  //   return 'Я не умею распознавать такие сообщения';
  // }

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

  @Command(Commands.ADMIN)
  @UseGuards(AdminGuard)
  async onAdminCommand(@Ctx() ctx: Scenes.SceneContext): Promise<void> {
    console.log('mmmm', (ctx.update as any).message);

    await ctx.scene.enter(ADMIN_SCENE_ID);
  }
}
