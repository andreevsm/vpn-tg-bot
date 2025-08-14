import { BotActions } from '@common/enums/bot-actions.enum';
import { Texts } from '@common/texts';
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
    [BotActions.PAY_NOW]: BotActions.PAY_DONE,
    [BotActions.PAY_DONE]: BotActions.APP_DOWNLOADED,
  },
};

export const BOT_CONFIG: Record<
  BotActions,
  { text: string; data?: ExtraReplyMessage | any }
> = {
  [BotActions.START]: {
    text: Texts.START,
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
    text: Texts.EXCELLENT,
    data: {
      reply_markup: {
        inline_keyboard: [
          [
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
    text: Texts.DEMO,
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
    text: Texts.APP_DOWNLOADED,
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
    text: Texts.FILE_DOWNLOADED,
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
    text: Texts.OS,
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
    text: Texts.OS,
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
    text: Texts.OS,
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
    text: Texts.OS,
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
    text: Texts.CONFIG_ADDED,
  },
  [BotActions.PAY_NOW]: {
    text: Texts.PAY_NOW,
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
    text: Texts.PAY_DONE,
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
};
