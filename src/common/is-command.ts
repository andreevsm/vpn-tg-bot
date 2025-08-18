import { Commands } from './constants';

export const isCommand = (text: string) => {
  const commands = [
    Commands.START,
    Commands.SUBSCRIPTION,
    Commands.HELP,
    Commands.UNSUBSCRIBE,
  ];

  const plainText = text.replace(/\//g, '');

  return commands.includes(plainText as Commands);
};
