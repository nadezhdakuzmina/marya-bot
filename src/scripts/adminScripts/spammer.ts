import type { Script, TelegramCore } from '@modules/core';
import type { Message } from 'node-telegram-bot-api';
import type { CreateScriptParams } from './types';

enum Commands {
  Any = '*',
  Send = 'Отправить',
  GoBack = '👈 Назад',
}

const createSpammer = (params: CreateScriptParams): Script => {
  const { users, helpMessage, adminMenu, scripts } = params;

  // Не стираем сообщение, используем как черновик
  let messageShortcut: string;

  const getText = () => {
    if (messageShortcut) {
      return ['*Найден черновик:*', messageShortcut];
    }

    return 'Напиши мне текст сообщения рассылки и мы вместе на него посмотрим перед отправкой';
  };

  return {
    text: getText,
    keyboard: [
      [
        { text: Commands.GoBack },
        { text: Commands.Send, checkAccess: () => !!messageShortcut },
      ],
    ],
    catchMessage(this: TelegramCore, message: Message) {
      const {
        text,
        from: { id: userID },
      } = message;

      if (text === Commands.GoBack) {
        return;
      }

      if (messageShortcut && text === Commands.Send) {
        Object.keys(users.users).forEach((uidS: string) => {
          const uid = Number(uidS);

          if (uid === userID) {
            return;
          }

          this.sendMessage(uid, messageShortcut);
        });

        this.sendMessage(userID, 'Рассылка отправлена!');
        messageShortcut = null;
        return;
      }

      messageShortcut = text;
      this.sendMessage(userID, '*Предварительный просмотр:*');
      this.sendMessage(userID, text, [
        [{ text: Commands.GoBack }, { text: Commands.Send }],
      ]);

      return false;
    },
    onText: {
      [Commands.Any]: {
        text: helpMessage,
        keyboard: adminMenu,
        onText: scripts,
      },
    },
  };
};

export default createSpammer;
