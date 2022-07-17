import type { Keyboard, Script, Scripts, TelegramCore } from '@modules/core';
import { CreateUserData } from '@modules/users';
import type { Message } from 'node-telegram-bot-api';
import type { Context } from './types';

interface UsersData {
  [uid: number]: Partial<CreateUserData>;
}

enum Answers {
  Yes = 'Да',
  No = 'Нет',
  Any = '*',
  Skip = 'Пропустить',
}

function createStartScript(this: Context, mainMenu: Keyboard): Script {
  const { users } = this;

  const usersData: UsersData = {};

  const registrationScript: Script = {
    text: 'Введи фио',
    catchMessage: (message: Message) => {
      const {
        text: fio,
        from: { id: userID },
      } = message;

      usersData[userID].fullName = fio;
    },
    onText: {
      [Answers.Any]: {
        text: 'Введите номер телефона',
        catchMessage: (message: Message) => {
          const {
            text: phone,
            from: { id: userID },
          } = message;

          usersData[userID].phone = phone;
        },
        onText: {
          [Answers.Any]: {
            text: 'Дата рождения',
            catchMessage(this: TelegramCore, message: Message) {
              const {
                text: birthday,
                from: { id: userID },
              } = message;

              usersData[userID].birthday = birthday;

              users.createUser(userID, usersData[userID] as CreateUserData);
              this.sendMessage(userID, 'Регистрация прошла успешно!');
            },
            onText: {
              [Answers.Any]: {
                text: 'Главное меню',
                keyboard: mainMenu,
              },
            },
          },
        },
      },
    },
  };

  return function (this: TelegramCore, { from: { id } }: Message) {
    if (id in users.users) {
      this.sendMessage(id, 'Вы уже авторизованы', mainMenu);
      return;
    }

    this.sendMessage(
      id,
      'Привет! Меня зовут Романова Мария. Я врач косметолог, а это чат бот, который помогает мне начислять бонусы, дарить скидки и делится уникальными предложениями. Приступим к регистрации?',
      [[{ text: Answers.Yes }, { text: Answers.No }]]
    );

    return {
      [Answers.Yes]: {
        text: 'Тогда начнем регистрацию. У тебя есть пригл код?',
        keyboard: [[{ text: Answers.Yes }, { text: Answers.No }]],
        catchMessage: (message: Message) => {
          usersData[message.from.id] = {};
        },
        onText: {
          [Answers.Yes]: {
            text: 'Введи код',
            catchMessage(this: TelegramCore, message: Message) {
              let codeOrSkip = message.text;

              if (codeOrSkip === Answers.Skip) {
                return;
              }

              if (!(codeOrSkip in users.inviteCodes)) {
                this.sendMessage(
                  message.from.id,
                  'Неверный код, попробуй еще раз',
                  [[{ text: Answers.Skip }]]
                );

                return false;
              }

              usersData[message.from.id].code = codeOrSkip;
            },
            onText: {
              [Answers.Any]: registrationScript,
            },
          },
          [Answers.No]: registrationScript,
        },
      },
      [Answers.No]: {
        text: 'Ладно! Приятно было пообщатсья!\nПриходи позже!',
      },
      [Answers.Any]: {
        text: 'Я тебя не поняла',
      },
    };
  };
}

export default createStartScript;
