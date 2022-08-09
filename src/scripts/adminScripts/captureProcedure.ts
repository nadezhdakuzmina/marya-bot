import type { Scripts, TelegramCore } from '@modules/core';
import type { Message } from 'node-telegram-bot-api';
import type { CreateScriptParams } from './types';

const SUM_REGEXP = /^\d+$/;

enum Commands {
  CaptureProcedure = 'Записать процедуру',
  Cancel = 'Отмена',
  AllRight = 'Все верно',
  Any = '*',
}

const createCaptureProcedureScript = (params: CreateScriptParams) => {
  const { users, helpMessage, adminMenu } = params;

  return {
    text: 'Напиши мне фамилию и имя или номер телефона клиента',
    onText: {
      [Commands.Any](this: TelegramCore, message: Message): Scripts {
        const {
          text: nameOrPhone,
          from: { id: userID },
        } = message;

        const user = users.findUsers(nameOrPhone)[0];

        if (!user) {
          this.sendMessage(userID, '*Ничего не найдено!*');
          this.sendMessage(userID, helpMessage, adminMenu);
          return params.scripts;
        }

        this.sendMessage(
          userID,
          '*Найден пользователь:*\n\n' +
            `*${user.fullName}*\n` +
            `${user.phone}\n` +
            `Бонусов - ${user.bonus}\n` +
            `Процедур - ${user.procedures.length}`,
          [[{ text: Commands.CaptureProcedure }], [{ text: Commands.Cancel }]]
        );

        let procedureName: string;
        let procedureCost: number;

        return {
          [Commands.CaptureProcedure]: {
            text: 'Укажи название процедуры',
            catchMessage(this: TelegramCore, message: Message) {
              const { text } = message;

              if (procedureName && text === Commands.AllRight) {
                return;
              }

              procedureName = message.text;

              this.sendMessage(
                userID,
                `Процедура - ${procedureName}\n` +
                  'Если не верно, отправь новое название процедуры',
                [[{ text: Commands.AllRight }]]
              );

              return false;
            },
            onText: {
              [Commands.Any]: {
                text: 'Теперь укажи стоимость процедуры в рублях',
                catchMessage(this: TelegramCore, message: Message) {
                  const { text } = message;

                  if (procedureCost && text === Commands.AllRight) {
                    const inviterUser = users.users[user.inviter];
                    const bonusBefore = inviterUser?.bonus || 0;

                    users.captureProcedure(user.id, {
                      name: procedureName,
                      sum: procedureCost,
                      date: Date.now(),
                    });

                    const bonuseNow = inviterUser?.bonus || 0;

                    this.sendMessage(
                      user.inviter,
                      `Ваш реферал: ${user.fullName} ` +
                        'прошла первую процедуру\n' +
                        `Вам начислено ${bonuseNow - bonusBefore}`
                    );

                    return;
                  }

                  if (!text.replace(/\s/g, '').match(SUM_REGEXP)) {
                    this.sendMessage(userID, 'Неверный формат!');
                    return false;
                  }

                  procedureCost = Number(text.replace(/\s/g, ''));

                  this.sendMessage(
                    userID,
                    `Стоимость процедуры - ${procedureCost}₽\n` +
                      'Если не верно, отправь новую стоимость процедуры',
                    [[{ text: Commands.AllRight }]]
                  );

                  return false;
                },
                onText: {
                  [Commands.Any](this: TelegramCore, message: Message) {
                    this.sendMessage(userID, 'Успешно записала процедуру');
                    this.sendMessage(userID, helpMessage, adminMenu);
                    return params.scripts;
                  },
                },
              },
            },
          },
          [Commands.Any]: {
            text: helpMessage,
            keyboard: adminMenu,
            onText: params.scripts,
          },
        };
      },
    },
  };
};

export default createCaptureProcedureScript;
