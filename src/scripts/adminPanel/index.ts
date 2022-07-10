import { Permitions } from '@modules/users';

import type { Message } from 'node-telegram-bot-api';
import type { Context } from '../types';

enum Commands {
  activateAccount = 'Активировать аккаунт',
  captureProcedure = 'Записать процедуру',
  goBack = '👈 Назад',
}

export function adminPanelThread(this: Context, message: Message) {
  const { telegram, users } = this;

  const {
    from: { id: userID },
  } = message;

  const user = users.getUser(userID);

  if (user.permitions !== Permitions.admin) {
    telegram.sendMessage(userID, 'Кажется, у тебя недостаточно прав!')
    return;
  }

  telegram.sendMessage(userID, (
    '*Добро пожаловать в админ-панель!*\n' +
    'Ниже список доступных команд:\n' +
    '\n' +
    `1. ${Commands.activateAccount}\n` +
    `2. ${Commands.captureProcedure}\n` +
    '\n' +
    `${Commands.goBack}`
  ), [
    [{ text: Commands.activateAccount }],
    [{ text: Commands.captureProcedure }],
    [{ text: Commands.goBack }]
  ]);

  const thread = telegram.createThread(message);

  thread.add(Commands.goBack, () => thread.quit());
}
