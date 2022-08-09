import renderList from '@utils/renderList';

import type { Script, Scripts, TelegramCore } from '@modules/core';
import type { Sale, UserData } from '@modules/users';
import type { Message } from 'node-telegram-bot-api';
import type { Context } from '../types';
import type { CreateScriptParams } from './types';

enum Commands {
  GiveSale = 'Подарить скидку',
  SetMainSale = 'Установить реферальную скидку',
  SetReferalBonusPercent = 'Установить реферальный процент',
  SelectUser = 'Выбрать пользователя',
  AllUsers = 'Всем пользователям',
  GoBack = '👈 Назад',
  Cancel = 'Отмена',
  Skip = 'Пропустить',
  AllRight = 'Все верно',
  Yes = 'Да',
  No = 'Нет',
  Any = '*',
}

function createSaleControls(this: Context, params: CreateScriptParams): Script {
  const { config } = this;
  const { users, helpMessage, adminMenu } = params;

  const getHelpMessage = () => {
    const { referalBonusPercent, referalSale } = config.settings;

    const bonusPercent = Math.floor(referalBonusPercent * 100);
    const initSale = Math.floor(referalSale * 100);

    return (
      '*Управление скидками и реферальной программой:*\n' +
      '\n' +
      `Реферальны бонусный процент - ${bonusPercent}%\n` +
      `Реферальная скидка новому клиенту - ${initSale}%\n` +
      '\n' +
      '*Список доступных команд:*\n' +
      '\n' +
      renderList([
        Commands.GiveSale,
        Commands.SetMainSale,
        Commands.SetReferalBonusPercent,
      ]) +
      '\n\n' +
      `${Commands.GoBack}`
    );
  };

  const keyboard = [
    [{ text: Commands.GiveSale }],
    [{ text: Commands.SetMainSale }],
    [{ text: Commands.SetReferalBonusPercent }],
    [{ text: Commands.GoBack }],
  ];

  const scripts: Scripts = {
    [Commands.GiveSale](this: TelegramCore, message: Message) {
      const {
        from: { id: userID },
      } = message;

      this.sendMessage(userID, 'Кому нужно выдать скидку?', [
        [{ text: Commands.SelectUser }, { text: Commands.AllUsers }],
        [{ text: Commands.Cancel }],
      ]);

      let saleName: string;
      let saleValue: number;
      let expiresDate: number;
      let counter: number;
      let highPriority: boolean;
      let selectedUser: UserData;

      const applySales = (): Promise<void> => {
        const newSale: Sale = {
          value: saleValue,
          name: saleName,
          expires: expiresDate,
          counter,
          highPriority,
        };

        if (selectedUser) {
          return users.updateUser(selectedUser.id, {
            sales: [...users.users[selectedUser.id].sales, newSale],
          });
        } else {
          return users.updateUsers((user) => ({
            sales: [...user.sales, newSale],
          }));
        }
      };

      const configureSaleScript: Script = {
        text: 'Как будет называться скидка?',
        catchMessage: (message: Message) => {
          const { text } = message;

          if (saleName && text === Commands.AllRight) {
            return;
          }

          saleName = text;

          this.sendMessage(
            userID,
            `Cкидка - ${saleName}\n` +
              'Если не верно, отправь новое название скидки',
            [[{ text: Commands.AllRight }]]
          );

          return false;
        },
        onText: {
          [Commands.Any]: {
            text: 'Теперь укажи значение скидки в процентах от 0 до 99 (%)',
            catchMessage: (message: Message) => {
              const { text } = message;

              if (saleValue && text === Commands.AllRight) {
                return;
              }

              if (!/^\d{1,2}$/.exec(text)) {
                this.sendMessage(
                  userID,
                  'Неверный формат!\nОтправь мне число от 0 до 99 (%)'
                );
                return false;
              }

              saleValue = Number(text) / 100;

              this.sendMessage(
                userID,
                `Cкидка - ${Math.floor(saleValue * 100)}%\n` +
                  'Если не верно, отправь новое значение',
                [[{ text: Commands.AllRight }]]
              );

              return false;
            },
            onText: {
              [Commands.Any]: {
                text: 'Напиши дату (ДД.ММ.ГГГГ) истечения скидки, если нужно',
                keyboard: [[{ text: Commands.Skip }]],
                catchMessage: (message: Message) => {
                  const { text } = message;

                  if (text === Commands.Skip) {
                    expiresDate = null;
                    return;
                  }

                  if (expiresDate && text === Commands.AllRight) {
                    return;
                  }

                  if (!/^\d{2}\.\d{2}\.\d{4}$/.exec(text)) {
                    this.sendMessage(
                      userID,
                      'Неправильный формат, отправь мне дату в формате ДД.ММ.ГГГГ',
                      [[{ text: Commands.Skip }]]
                    );

                    return false;
                  }

                  expiresDate = new Date(text).getTime();

                  this.sendMessage(
                    userID,
                    `Дата истечения - ${text}\n` +
                      'Если не верно, отправь правильную дату',
                    [[{ text: Commands.AllRight }], [{ text: Commands.Skip }]]
                  );

                  return false;
                },
                onText: {
                  [Commands.Any]: {
                    text: 'Укажи количество использований, если нужно',
                    keyboard: [[{ text: Commands.Skip }]],
                    catchMessage: (message: Message) => {
                      const { text } = message;

                      if (text === Commands.Skip) {
                        counter = null;
                        return;
                      }

                      if (counter && text === Commands.AllRight) {
                        return;
                      }

                      if (!/^\d+$/.exec(text)) {
                        this.sendMessage(
                          userID,
                          'Неправильный формат, отправь мне любое число больше 0',
                          [[{ text: Commands.Skip }]]
                        );

                        return false;
                      }

                      counter = Number(text);

                      this.sendMessage(
                        userID,
                        `Счетчик использований - ${counter}\n` +
                          'Если не верно, отправь нужное число',
                        [
                          [{ text: Commands.AllRight }],
                          [{ text: Commands.Skip }],
                        ]
                      );

                      return false;
                    },
                    onText: {
                      [Commands.Any]: {
                        text: 'Нужен повышенный приотитет скидки?',
                        keyboard: [
                          [{ text: Commands.Yes }, { text: Commands.No }],
                        ],
                        catchMessage: async (
                          message: Message
                        ): Promise<false | void> => {
                          const { text } = message;

                          if (text === Commands.Yes) {
                            highPriority = true;
                          } else if (text === Commands.No) {
                            highPriority = false;
                          } else {
                            this.sendMessage(
                              userID,
                              'Я тебя не поняла, напиши да или нет',
                              [[{ text: Commands.Yes }, { text: Commands.No }]]
                            );

                            return false;
                          }

                          await applySales();
                          this.sendMessage(userID, 'Скидки успешно применены');
                        },
                        onText: {
                          [Commands.Any]: {
                            text: getHelpMessage,
                            onText: params.scripts,
                            keyboard: adminMenu,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      return {
        [Commands.AllUsers]: configureSaleScript,
        [Commands.SelectUser]: {
          text: 'Напиши мне фамилию и имя или номер телефона клиента, которого нужно найти',
          keyboard: [[{ text: Commands.Cancel }]],
          catchMessage: (message: Message) => {
            const {
              text,
              from: { id: userID },
            } = message;

            if (selectedUser && text === Commands.AllRight) {
              return;
            }

            const usersList = users.findUsers(text);

            if (!usersList.length) {
              this.sendMessage(
                userID,
                'Пользователь не найден, попробуй еще раз!',
                [[{ text: Commands.Cancel }]]
              );
              return false;
            }

            const user = usersList[0];
            selectedUser = user;

            this.sendMessage(
              userID,
              `Скидка будет применена пользователю: ${user.fullName}\nУкажи нового пользователя или пойдем дальше`,
              [[{ text: Commands.AllRight }]]
            );
            return false;
          },
          onText: {
            [Commands.Any]: configureSaleScript,
            [Commands.Cancel]: {
              text: getHelpMessage,
              onText: params.scripts,
              keyboard: adminMenu,
            },
          },
        },
        [Commands.Cancel]: {
          text: getHelpMessage,
          onText: params.scripts,
          keyboard: adminMenu,
        },
      };
    },
    [Commands.SetMainSale]: {
      text: 'Укажи значение первоначальной скидки в процентах (%)',
      async catchMessage(
        this: TelegramCore,
        message: Message
      ): Promise<false | void> {
        const {
          text,
          from: { id: userID },
        } = message;

        if (!/^\d{1,2}$/.exec(text)) {
          this.sendMessage(
            userID,
            'Неверный формат!\nОтправь мне число от 0 до 99 (%)'
          );
          return false;
        }

        await config.updateSettings({
          referalSale: Number(text) / 100,
        });

        this.sendMessage(userID, 'Значение установлено!');
      },
      onText: {
        [Commands.Any]: {
          text: getHelpMessage,
          keyboard: adminMenu,
          onText: params.scripts,
        },
      },
    },
    [Commands.SetReferalBonusPercent]: {
      text: 'Укажи значение реферального процента (%)',
      async catchMessage(
        this: TelegramCore,
        message: Message
      ): Promise<false | void> {
        const {
          text,
          from: { id: userID },
        } = message;

        if (!/^\d{1,2}$/.exec(text)) {
          this.sendMessage(
            userID,
            'Неверный формат!\nОтправь мне число от 0 до 99 (%)'
          );
          return false;
        }

        await config.updateSettings({
          referalBonusPercent: Number(text) / 100,
        });

        this.sendMessage(userID, 'Значение установлено!');
      },

      onText: {
        [Commands.Any]: {
          text: getHelpMessage,
          keyboard: adminMenu,
          onText: params.scripts,
        },
      },
    },
    [Commands.GoBack]: {
      text: helpMessage,
      keyboard: adminMenu,
      onText: params.scripts,
    },
    [Commands.Any]: {
      text: 'Я тебя не поняла',
      onText: params.scripts,
      keyboard: adminMenu,
    },
  };

  return {
    text: getHelpMessage,
    onText: scripts,
    keyboard,
  };
}

export default createSaleControls;
