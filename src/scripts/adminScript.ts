import renderList from '@utils/renderList';

import type { Keyboard, Script, Scripts } from '@modules/core';
import { Message } from 'node-telegram-bot-api';
import type { Context } from './types';

enum Commands {
  usersList = 'Список клиентов',
  captureProcedure = 'Записать процедуру',
  goBack = '👈 Назад',
}

const MAX_USERS_IN_MESSAGE = 30;

function createAdminScript(this: Context, mainMenu: Keyboard): Script {
  const { users } = this;

  const helpMessage =
    'Ниже список доступных команд:\n' +
    '\n' +
    renderList([Commands.usersList, Commands.captureProcedure]) +
    '\n\n' +
    `${Commands.goBack}`;

  const startMessage = '*Добро пожаловать в админ-панель!*\n' + helpMessage;

  const adminMenu: Keyboard = [
    [{ text: Commands.usersList }],
    [{ text: Commands.captureProcedure }],
    [{ text: Commands.goBack }],
  ];

  const scripts: Scripts = {
    [Commands.usersList](message: Message): Scripts {
      const {
        from: { id: userID },
      } = message;

      let usersList = Object.values(users.users).map(
        (user) => `${user.fullName} - ${user.phone}`
      );

      let text = 'Список клиентов:\n\n';

      while (usersList.length) {
        const usersGroup = usersList.slice(0, MAX_USERS_IN_MESSAGE);
        usersList = usersList.slice(MAX_USERS_IN_MESSAGE);

        text += renderList(usersGroup);
        this.sendMessage(userID, text);
        text = '';
      }

      this.sendMessage(userID, helpMessage, adminMenu);
      return scripts;
    },
    [Commands.goBack]: {
      text: 'Главное меню',
      keyboard: mainMenu,
    },
  };

  return {
    text: startMessage,
    keyboard: adminMenu,
    onText: scripts,
  };
}

export default createAdminScript;
