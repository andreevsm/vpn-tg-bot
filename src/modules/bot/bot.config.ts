import { BotActions } from '@common/enums/bot-actions.enum';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

export const SUBSCRIPTION_STATE = {
  initialValue: BotActions.START,
  transitions: {
    [BotActions.START]: [BotActions.EXCELLENT, BotActions.PAY_NOW],
    [BotActions.EXCELLENT]: [BotActions.PAY_NOW, BotActions.DEMO_SUBSCRIPTION],
    [BotActions.DEMO_SUBSCRIPTION]: BotActions.APP_DOWNLOADED,
    [BotActions.APP_DOWNLOADED]: BotActions.FILE_DOWNLOADED,
    [BotActions.FILE_DOWNLOADED]: [
      BotActions.MACOS,
      BotActions.WINDOWS,
      BotActions.IOS,
      BotActions.ANDROID,
    ],
    [BotActions.MACOS]: BotActions.CONFIG_ADDED,
    [BotActions.WINDOWS]: BotActions.CONFIG_ADDED,
    [BotActions.IOS]: BotActions.CONFIG_ADDED,
    [BotActions.ANDROID]: BotActions.CONFIG_ADDED,
    [BotActions.CONFIG_ADDED]: BotActions.FINISH,
    [BotActions.PAY_NOW]: BotActions.PAY_DONE,
    [BotActions.PAY_DONE]: BotActions.APP_DOWNLOADED,
  },
};

export const BOT_CONFIG: Record<
  BotActions,
  { text: string; data?: ExtraReplyMessage | any }
> = {
  [BotActions.START]: {
    text: 'Привет! Меня зовут ANSE VPN Bot и я помогу тебе настроить VPN',
    data: {
      reply_markup: {
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
  },
  [BotActions.EXCELLENT]: {
    text: `Перед тем, как мы продолжим, важно сказать.
          \nПодписка на меня стоит 200 рублей в месяц. Помимо этого у тебя будет возможность использовать demo режим и целых 24 часа пользоваться VPN бесплатно.
          \nЯ очень хочу, чтобы ты на 100% убедился в скорости работы VPN`,
    data: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Demo режим',
              callback_data: BotActions.DEMO_SUBSCRIPTION,
            },
            {
              text: 'Оплатить сейчас',
              callback_data: BotActions.PAY_NOW,
            },
          ],
        ],
      },
    },
  },
  [BotActions.DEMO_SUBSCRIPTION]: {
    text: `Для начала скачай приложение WireGuard, оно доступно в [Google Play](https://play.google.com/store/apps/details?id=com.wireguard.android&hl=ru) и [App Store](https://apps.apple.com/ru/app/wireguard/id1441195209)
    Если хочешь использовать VPN на компьютере, то можешь скачать приложение с [официального сайта](https://www.wireguard.com/install/)`,
    data: {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Готово',
              callback_data: BotActions.APP_DOWNLOADED,
            },
          ],
        ],
      },
    },
  },
  [BotActions.APP_DOWNLOADED]: {
    text: `Отлично! Вот файл с настройками. Сохрани его на своем устройстве`,
    data: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Готово',
              callback_data: BotActions.FILE_DOWNLOADED,
            },
          ],
        ],
      },
    },
  },
  [BotActions.FILE_DOWNLOADED]: {
    text: `Теперь укажи свое устройство`,
    data: {
      reply_markup: {
        one_time_keyboard: true,
        inline_keyboard: [
          [
            {
              text: 'Android',
              callback_data: BotActions.ANDROID,
            },
            {
              text: 'IPhone',
              callback_data: BotActions.IOS,
            },
            {
              text: 'Windows',
              callback_data: BotActions.WINDOWS,
            },
            {
              text: 'Mac',
              callback_data: BotActions.MACOS,
            },
          ],
        ],
      },
    },
  },
  [BotActions.MACOS]: {
    text: `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
    data: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Готово',
              callback_data: BotActions.CONFIG_ADDED,
            },
          ],
        ],
      },
    },
  },
  [BotActions.WINDOWS]: {
    text: `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
    data: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Готово',
              callback_data: BotActions.CONFIG_ADDED,
            },
          ],
        ],
      },
    },
  },
  [BotActions.IOS]: {
    text: `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
    data: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Готово',
              callback_data: BotActions.CONFIG_ADDED,
            },
          ],
        ],
      },
    },
  },
  [BotActions.ANDROID]: {
    text: `Заходи в приложение WireGuard и тыкай на плюсик как показано на картинке`,
    data: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Готово',
              callback_data: BotActions.CONFIG_ADDED,
            },
          ],
        ],
      },
    },
  },
  [BotActions.CONFIG_ADDED]: {
    text: `Теперь ты можешь включать VPN и наслаждаться безопасным интернетом`,
  },
  [BotActions.PAY_NOW]: {
    text: `Переведи на номер карты 5536 9137 5110 3132 сумму 200 руб.`,
    data: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Готово',
              callback_data: BotActions.PAY_DONE,
            },
          ],
        ],
      },
    },
  },
  [BotActions.PAY_DONE]: {
    text: `Отлично! Я проверю твой платеж, а пока скачай приложение WireGuard, оно доступно в Google Play (https://play.google.com/store/apps/details?id=com.wireguard.android&hl=ru) и App Store (https://apps.apple.com/ru/app/wireguard/id1441195209). Если хочешь использовать VPN на компьютере, то можешь скачать приложение из официального сайта https://www.wireguard.com/install/`,
    data: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Готово',
              callback_data: BotActions.APP_DOWNLOADED,
            },
          ],
        ],
      },
    },
  },
  [BotActions.FINISH]: {
    text: 'test',
  },
};
