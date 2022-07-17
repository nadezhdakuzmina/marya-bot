import renderList from '@utils/renderList';

import type { Keyboard, Script, Scripts, TelegramCore } from '@modules/core';
import { Message } from 'node-telegram-bot-api';
import type { Context } from './types';

enum Commands {
  UsersList = 'Список клиентов',
  CaptureProcedure = 'Записать процедуру',
  FindUser = 'Найти клиента',
  GoBack = '👈 Назад',
  Any = '*',
}

const MAX_USERS_IN_MESSAGE = 30;

function createAdminScript(this: Context, mainMenu: Keyboard): Script {
  const { users } = this;

  const helpMessage =
    '*Ниже список доступных команд:*\n' +
    '\n' +
    renderList([
      Commands.UsersList,
      Commands.FindUser,
      Commands.CaptureProcedure,
    ]) +
    '\n\n' +
    `${Commands.GoBack}`;

  const startMessage = '*Добро пожаловать в админ-панель!*\n' + helpMessage;

  const adminMenu: Keyboard = [
    [{ text: Commands.UsersList }],
    [{ text: Commands.FindUser }],
    [{ text: Commands.CaptureProcedure }],
    [{ text: Commands.GoBack }],
  ];

  const scripts: Scripts = {
    [Commands.UsersList](this: TelegramCore, message: Message): Scripts {
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
      return scripts;
    },
    [Commands.FindUser]: {
      text: 'Напиши мне фамилию и имя или номер телефона клиента, которого нужно найти',
      onText: {
        [Commands.Any](this: TelegramCore, message: Message): Scripts {
          const {
            text: nameOrPhone,
            from: { id: userID },
          } = message;

          const usersList = users.findUsers(nameOrPhone);

          if (!usersList.length) {
            this.sendMessage(userID, '*Ничего не найдено!*');
            this.sendMessage(userID, helpMessage, adminMenu);
            return scripts;
          }

          this.sendMessage(
            userID,
            '*Список клиентов:*\n\n' +
              renderList(usersList.map((user) => user.fullName)) +
              '\n\n' +
              'Выбери клиента для которого вывести подробную информацию',
            usersList.map((user) => [{ text: user.fullName }])
          );

          function getFullName(this: TelegramCore, message: Message): Scripts {
            const {
              text: fullName,
              from: { id: userID },
            } = message;

            const user = users.findUsers(fullName)[0];

            if (!user) {
              this.sendMessage(
                userID,
                'Пользователь не найден, попробуй еще раз!',
                usersList.map((user) => [{ text: user.fullName }])
              );

              return {
                [Commands.Any]: getFullName,
              };
            }

            this.sendMessage(
              userID,
              `*${user.fullName}*\n` +
                `${user.phone}\n` +
                `Бонусов - ${user.bonus}\n` +
                `Процедур - ${user.procedures.length}`
            );

            this.sendMessage(userID, helpMessage, adminMenu);
            return scripts;
          }

          return {
            [Commands.Any]: getFullName,
          };
        },
      },
    },
    [Commands.GoBack]: {
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
