import { Keyboard, Script, TelegramCore } from '@modules/core';
import normalizePhone from '@utils/normalizePhone';
import renderList from '@utils/renderList';

import type { Message } from 'node-telegram-bot-api';
import type { CreateScriptParams } from './types';

enum Commands {
  Phone = 'Телефон',
  Fio = 'Фио',
  Any = '*',
  GoBack = '👈 Назад',
}

const createChangeData = (params: CreateScriptParams): Script => {
  const { users, userMenu, scripts } = params;
  const helpMessage =
    '*Выберите данные, которые хотите изменить:*\n' +
    '\n' +
    renderList([Commands.Phone, Commands.Fio]) +
    '\n\n' +
    `${Commands.GoBack}`;

  const changeFioScript: Script = {
    text: 'Введи фио',
    catchMessage(this: TelegramCore, message: Message) {
      const {
        text: fullName,
        from: { id: userID },
      } = message;

      users.updateUser(userID, { fullName });
    },
    onText: {
      [Commands.Any]: {
        text: 'Данные изменены',
        keyboard: userMenu,
        onText: params.scripts,
      },
    },
  };

  const changePhoneScript: Script = {
    text: 'Введи номер телефона',
    catchMessage(this: TelegramCore, message: Message) {
      const {
        text: phone,
        from: { id: userID },
      } = message;

      try {
        normalizePhone(message.text);
      } catch (e) {
        this.sendMessage(userID, 'Неверный формат, попробуй еще раз!');
        return false;
      }

      users.updateUser(userID, { phone });
    },
    onText: {
      [Commands.Any]: {
        text: 'Данные изменены',
        keyboard: userMenu,
        onText: params.scripts,
      },
    },
  };

  const changeDataMenu: Keyboard = [
    [{ text: Commands.Phone }],
    [{ text: Commands.Fio }],
    [{ text: Commands.GoBack }],
  ];

  return {
    text: helpMessage,
    keyboard: changeDataMenu,
    onText: {
      [Commands.Phone]: changePhoneScript,
      [Commands.Fio]: changeFioScript,
      [Commands.GoBack]: {
        text: 'Главное меню',
        keyboard: userMenu,
        onText: scripts,
      },
    },
  };
};

export default createChangeData;
