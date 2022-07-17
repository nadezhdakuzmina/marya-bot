import renderList from '@utils/renderList';

import type { Scripts, TelegramCore } from '@modules/core';
import type { Message } from 'node-telegram-bot-api';
import type { CreateScriptParams } from './types';

const MAX_USERS_IN_MESSAGE = 30;

const createUserListScript = (params: CreateScriptParams) => {
  const { users, helpMessage, adminMenu } = params;

  return function (this: TelegramCore, message: Message): Scripts {
    const {
      from: { id: userID },
    } = message;

    let usersList = Object.values(users.users).map(
      (user) => `${user.fullName} ${user.phone}`
    );

    let text = '*Список клиентов:*\n\n';

    while (usersList.length) {
      const usersGroup = usersList.slice(0, MAX_USERS_IN_MESSAGE);
      usersList = usersList.slice(MAX_USERS_IN_MESSAGE);

      text += renderList(usersGroup);
      this.sendMessage(userID, text);
      text = '';
    }

    this.sendMessage(userID, helpMessage, adminMenu);
    return params.scripts;
  };
};

export default createUserListScript;
