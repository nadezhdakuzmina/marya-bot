import renderList from '@utils/renderList';
import { Message } from 'node-telegram-bot-api';
import createChangeData from './changeData';
import createProfile from './profile';
import { CreateScriptParams } from './types';

import type { Keyboard, Script, Scripts, TelegramCore } from '@modules/core';
import type { Context } from '../types';

enum Commands {
  ChangeData = 'Изменить данные',
  UserProfile = 'Мой профиль',
  AddUser = 'Пригласить друга',
  GoBack = '👈 Назад',
  Any = '*',
  Code = 'Узнать свой код',
}

function createUserScripts(this: Context, mainMenu: Keyboard): Script {
  const { users } = this;

  const helpMessage =
    '*Ниже список доступных команд:*\n' +
    '\n' +
    renderList([Commands.UserProfile, Commands.ChangeData, Commands.AddUser]) +
    '\n\n' +
    `${Commands.GoBack}`;

  const startMessage = '*Добро пожаловать в личный кабинет*\n' + helpMessage;

  const userMenu: Keyboard = [
    [{ text: Commands.UserProfile }],
    [{ text: Commands.ChangeData }],
    [{ text: Commands.AddUser }],
    [{ text: Commands.GoBack }],
  ];

  const scripts: Scripts = {};

  const context: CreateScriptParams = {
    scripts,
    helpMessage,
    userMenu,
    users,
  };

  (scripts[Commands.ChangeData] = createChangeData(context)),
    (scripts[Commands.UserProfile] = createProfile(context)),
    (scripts[Commands.AddUser] = {
      text: 'Чтобы пригласить друга, отправьте ему свой пригласительный код',
      keyboard: [[{ text: Commands.Code }], [{ text: Commands.GoBack }]],
      onText: {
        [Commands.GoBack]: {
          text: 'Главное меню',
          keyboard: userMenu,
          onText: scripts,
        },
        [Commands.Any](this: TelegramCore, message: Message) {
          const {
            from: { id: userID },
          } = message;

          const code = users.getUser(userID).inviteCode;
          this.sendMessage(userID, `*Ваш код:* \`${code}\``, userMenu);
          return scripts;
        },
      },
    });
  scripts[Commands.GoBack] = {
    text: 'Главное меню',
    keyboard: mainMenu,
  };
  scripts[Commands.Any] = {
    text: 'Я тебя не поняла',
    keyboard: mainMenu,
  };

  return {
    text: startMessage,
    keyboard: userMenu,
    onText: scripts,
  };
}

export default createUserScripts;
