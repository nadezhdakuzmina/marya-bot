import formatBirthday from '@utils/formatBirthday';
import renderList from '@utils/renderList';

import type { Scripts, TelegramCore } from '@modules/core';
import type { Message } from 'node-telegram-bot-api';
import type { CreateScriptParams } from './types';

enum Commands {
  Any = '*',
}

const createFindUserScript = (params: CreateScriptParams) => {
  const { users, helpMessage, adminMenu, scripts } = params;

  return {
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
            text,
            from: { id: userID },
          } = message;

          const user = usersList.find(({ fullName }) => text === fullName);

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
              `Дата рождения: ${formatBirthday(user.birthday)}\n` +
              `Телефон: ${user.phone}\n` +
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
  };
};

export default createFindUserScript;
