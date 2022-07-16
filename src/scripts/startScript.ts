import type { Script, Scripts } from '@modules/core';
import type { Message } from 'node-telegram-bot-api';
import type { Context } from './types';

enum Answers {
  Yes = 'Да',
  No = 'Нет',
  Any = '*',
}

function createStartScript(this: Context): Script {
  const { users } = this;

  const unknownMessage = {
    text: 'Я тебя не поняла',
  };

  return {
    text: 'Привет! Меня зовут Романова Мария. Я врач косметолог, а это чат бот, который помогает мне начислять бонусы, дарить скидки и делится уникальными предложениями. Приступим к регистрации?',
    keyboard: [[{ text: Answers.Yes }, { text: Answers.No }]],
    onText: {
      [Answers.Yes]: {
        text: 'Тогда начнем регистрацию, напиши фамилию имя отчество',
        onText: {
          [Answers.Any](message: Message) {
            // Продолжить ветку событий
          },
        },
      },
      [Answers.No]: {
        text: 'Ладно! Приятно было пообщатсья!\nПриходи позже!',
      },
      [Answers.Any]: unknownMessage,
    },
  };
}

export default createStartScript;
