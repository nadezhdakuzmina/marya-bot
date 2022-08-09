import type { Keyboard, Script, Scripts, TelegramCore } from '@modules/core';
import { CreateUserData, Errors } from '@modules/users';
import normalizeDate from '@utils/normalizeDate';
import normalizePhone from '@utils/normalizePhone';
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
    text: 'Как вас зовут? ☺️\nМне достаточно будет фамилии и имени',
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
        catchMessage(this: TelegramCore, message: Message) {
          const {
            text: phone,
            from: { id: userID },
          } = message;

          try {
            usersData[userID].phone = normalizePhone(phone);
          } catch (e) {
            this.sendMessage(userID, 'Неверный формат!\nПопробуй еще раз');
            return false;
          }

          const findedUsers = users.findUsers(usersData[userID].phone);
          if (findedUsers[0]?.phone === usersData[userID].phone) {
            this.sendMessage(
              userID,
              'Такой номер телефона уже был использован ранее!\nВведите другой номер'
            );
            return false;
          }
        },
        onText: {
          [Answers.Any]: {
            text: 'А теперь дату рождения в формате ГГГГ.ММ.ДД',
            onText: {
              [Answers.Any](this: TelegramCore, message: Message): void {
                const {
                  text: birthday,
                  from: { id: userID },
                } = message;

                try {
                  usersData[userID].birthday = normalizeDate(birthday);
                } catch (e) {
                  this.sendMessage(
                    userID,
                    'Неверный формат!\nПопробуй еще раз'
                  );
                }

                try {
                  users.createUser(userID, usersData[userID] as CreateUserData);
                  delete usersData[userID];

                  this.sendMessage(userID, 'Регистрация прошла успешно!');
                  this.sendMessage(userID, 'Главное меню', mainMenu);
                } catch (error) {
                  this.sendMessage(
                    userID,
                    'Что-то пошло не так, попробуйте позже!\n/start'
                  );
                  delete usersData[userID];
                  console.error(error);
                }
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
        text: 'Тогда начнем регистрацию. У тебя есть пригласительный код?',
        keyboard: [[{ text: Answers.Yes }, { text: Answers.No }]],
        catchMessage: (message: Message) => {
          usersData[message.from.id] = {};
        },
        onText: {
          [Answers.Yes]: {
            text: 'Введи пригласительный код',
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
