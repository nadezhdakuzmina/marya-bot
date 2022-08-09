import { Keyboard, Script, Scripts, TelegramCore } from '@modules/core';
import renderList from '@utils/renderList';

import type { Message } from 'node-telegram-bot-api';
import type { CreateScriptParams } from './types';

enum Commands {
  UserProfile = 'Мой профиль',
  Sales = 'Актуальные акции',
  Bonus = 'Бонусы',
  AddUser = 'Пригласить друга',
  GoBack = '👈 Назад',
  Any = '*',
  Code = 'Узнать свой код',
}

const profileMenu: Keyboard = [
  [{ text: Commands.Bonus }],
  [{ text: Commands.Sales }],
  [{ text: Commands.GoBack }],
];

const createProfile = (params: CreateScriptParams): Script => {
  const { users, userMenu, scripts } = params;

  const helpMessage =
    '*В этом разделе можно посмотреть актульные акции и узнать сколько накопленно баллов*\n' +
    '\n' +
    renderList([Commands.Bonus, Commands.Sales]) +
    '\n\n' +
    `${Commands.GoBack}`;

  const profileScripts: Script = {
    text: helpMessage,
    keyboard: profileMenu,
    onText: {
      [Commands.Bonus](this: TelegramCore, message: Message): Scripts {
        const {
          from: { id: userID },
        } = message;

        const bonus = users.getUser(userID).bonus;
        this.sendMessage(userID, `*Ваши бонусы: * ${bonus}`, userMenu);
        return scripts;
      },
      [Commands.Sales](this: TelegramCore, message: Message) {
        const {
          from: { id: userID },
        } = message;

        const sales = users
          .getUser(userID)
          .sales.map((item) => `${item.name} - ${Number(item.value) * 100}%`)
          .join('\n');

        this.sendMessage(userID, `*Ваши скидки:*\n${sales}`, userMenu);
        return scripts;
      },
      [Commands.GoBack]: {
        text: 'Главное меню',
        keyboard: userMenu,
        onText: scripts,
      },
    },
  };

  return profileScripts;
};

export default createProfile;
