import formatBirthday from '@utils/formatBirthday';

import type { Scripts, TelegramCore } from '@modules/core';
import getActualSale from '@utils/getActualSale';
import type { Message } from 'node-telegram-bot-api';
import type { CreateScriptParams } from './types';

const SUM_REGEXP = /^\d+$/;

enum Commands {
  CaptureProcedure = 'Записать процедуру',
  Cancel = 'Отмена',
  AllRight = 'Все верно',
  Good = 'Хорошо',
  Any = '*',
}

const createCaptureProcedureScript = (params: CreateScriptParams) => {
  const { users, helpMessage, adminMenu, scripts } = params;

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
          return scripts;
        }

        this.sendMessage(
          userID,
          '*Найден пользователь:*\n\n' +
            `*${user.fullName}*\n` +
            `Дата рождения: ${formatBirthday(user.birthday)}\n` +
            `Телефон: ${user.phone}\n` +
            `Бонусов - ${user.bonus}\n` +
            `Процедур - ${user.procedures.length}`,
          [[{ text: Commands.CaptureProcedure }], [{ text: Commands.Cancel }]]
        );

        let procedureName: string;
        let procedureCost: number;
        let hasWarning = false;
        let hasCaptured = false;

        return {
          [Commands.CaptureProcedure]: {
            text: 'Укажи название процедуры',
            catchMessage(this: TelegramCore, message: Message) {
              const { text } = message;

              if (procedureName && text === Commands.AllRight) {
                return;
              }

              procedureName = text;

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

                  if (hasCaptured && hasWarning) {
                    if (text === Commands.Good) {
                      return;
                    }
                  }

                  if (procedureCost && text === Commands.AllRight) {
                    const inviterUser = users.users[user.inviter];
                    const inviterBonusBefore = inviterUser?.bonus || 0;
                    const isFirstProcedure = !user.procedures.length;

                    users.captureProcedure(user.id, {
                      name: procedureName,
                      sum: procedureCost,
                      date: Date.now(),
                    });

                    const { actual, sales } = getActualSale(user.sales);
                    const bonusToKill = Math.min(
                      procedureCost * (1 - (actual?.value || 0)),
                      user.bonus
                    );

                    users.updateUser(user.id, {
                      bonus: user.bonus - bonusToKill,
                      sales,
                    });

                    if (actual || bonusToKill) {
                      const newProcedureCost =
                        procedureCost * (1 - (actual?.value || 0)) -
                        bonusToKill;

                      this.sendMessage(
                        userID,
                        `*Итог по процедуре:*\n\n` +
                          (bonusToKill
                            ? `Списано бонусов: ${bonusToKill}\n`
                            : '') +
                          (actual
                            ? `Учтена скидка: ${actual.name} - ${
                                actual.value * 100
                              }%\n`
                            : '') +
                          '\n' +
                          `*К оплате: ${newProcedureCost.toFixed(2)}₽*`,
                        [[{ text: Commands.Good }]]
                      );

                      hasWarning = true;
                      hasCaptured = true;
                      return false;
                    }

                    if (isFirstProcedure) {
                      this.sendMessage(
                        user.inviter,
                        `Ваш реферал: ${user.fullName} ` +
                          'прошла первую процедуру\n' +
                          `Вам начислено ${
                            (inviterUser?.bonus || 0) - inviterBonusBefore
                          }`
                      );
                    }

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
                    return scripts;
                  },
                },
              },
            },
          },
          [Commands.Any]: {
            text: helpMessage,
            keyboard: adminMenu,
            onText: scripts,
          },
        };
      },
    },
  };
};

export default createCaptureProcedureScript;
