import type { Message } from 'node-telegram-bot-api';
import type { Context } from './types';

export function onUnknownMessage(this: Context, message: Message) {
  const { telegram } = this;

  const {
    from: { id: userID },
  } = message;

  telegram.sendMessage(userID, 'Прости, я тебя не поняла 😔');
}
