import TelegramBot from 'node-telegram-bot-api';

import timeout from '@utils/timeout';

import type { ChatType, Message } from 'node-telegram-bot-api';
import type {
  CheckAccessFunc,
  Config,
  Keyboard,
  KeyboardButton,
  Script,
  Scripts,
  UserCatchPoints,
  UserScriptsPoints,
} from './types';

export class TelegramCore {
  private config: Config;
  private client: TelegramBot;
  private activePromise: Promise<void>;
  private scripts: Scripts;
  private userScriptsPoints: UserScriptsPoints;
  private userCatchPoints: UserCatchPoints;

  constructor(config: Config) {
    this.config = config;

    const { token } = config.credentials;
    this.client = new TelegramBot(token, { polling: true });

    this.userScriptsPoints = {};
    this.userCatchPoints = {};

    this.client.on('polling_error', console.error);
    this.client.on('message', this.onMessage.bind(this));

    console.log('Telegram bot started!');
  }

  public async sendMessage(
    chatID: number,
    messageOrFunc: string | string[] | (() => string | string[]),
    keyboard?: Keyboard
  ): Promise<number[]> {
    return this.queue(async () => {
      let currentKeyboard = keyboard;

      if (currentKeyboard) {
        currentKeyboard = currentKeyboard.reduce((newKeyboard, keyboardRow) => {
          const row = keyboardRow.reduce((newKeyboardRow, button) => {
            if (!button.checkAccess || button.checkAccess(chatID)) {
              newKeyboardRow.push({
                text: button.text,
              } as KeyboardButton);
            }

            return newKeyboardRow;
          }, [] as KeyboardButton[]);

          if (currentKeyboard.length) {
            newKeyboard.push(row);
          }

          return newKeyboard;
        }, [] as Keyboard);

        if (!currentKeyboard.length) {
          currentKeyboard = null;
        }
      }

      let messages: string[] | string;
      if (typeof messageOrFunc === 'function') {
        messages = messageOrFunc();
      } else {
        messages = messageOrFunc;
      }

      let messageTexts: string[];
      if (!Array.isArray(messages)) {
        messageTexts = [messages];
      } else {
        messageTexts = messages;
      }

      const messageIDs: number[] = [];

      for (let text of messageTexts) {
        await this.client
          .sendMessage(chatID, text, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: currentKeyboard
              ? {
                  keyboard: currentKeyboard,
                  resize_keyboard: true,
                }
              : {
                  remove_keyboard: true,
                },
          })
          .then(({ message_id }) => messageIDs.push(message_id))
          .catch((error) => {
            if (!error.response) {
              console.error(`Telegram Error: ${error}`);
            }

            const {
              body: { description },
            } = error.response;

            console.error(`Telegram Error: ${description}`);
            return null;
          });
      }

      return messageIDs;
    });
  }

  public privateScript(
    script: Script,
    anotherCase: Script,
    getAccess: CheckAccessFunc
  ): Script {
    return (message: Message) => {
      const {
        from: { id: userID },
      } = message;

      const callScript = (scriptToCall: Script): Scripts => {
        if (typeof scriptToCall === 'function') {
          return scriptToCall.call(this, message);
        }

        if (Array.isArray(scriptToCall.text)) {
          scriptToCall.text.forEach((text) => {
            this.sendMessage(userID, text, scriptToCall.keyboard);
          });
        } else {
          this.sendMessage(
            userID,
            scriptToCall.text as string | (() => string),
            scriptToCall.keyboard
          );
        }

        this.userCatchPoints[userID] = scriptToCall.catchMessage;
        return scriptToCall.onText;
      };

      if (getAccess(userID)) {
        return callScript(script);
      }

      return callScript(anotherCase);
    };
  }

  public updateMessage(
    chatID: number,
    messageID: number,
    message: string
  ): Promise<boolean> {
    return this.queue(() =>
      this.client
        .editMessageText(message, {
          chat_id: chatID,
          message_id: messageID,
          parse_mode: 'Markdown',
        })
        .then(() => true)
        .catch(
          ({
            response: {
              body: { description },
            },
          }) => {
            console.error(`Telegram Error: ${description}`);
            return null;
          }
        )
    );
  }

  public configureScripts(scripts: Scripts): void {
    this.scripts = scripts;
  }

  private async queue<T>(func: () => Promise<T>): Promise<T> {
    const { sendMessageDelay } = this.config.settings;

    const currPromise = new Promise<T>(async (resolve) => {
      if (this.activePromise) {
        await this.activePromise;
      }

      resolve(func());
    });

    this.activePromise = currPromise.then(() => timeout(sendMessageDelay));

    return currPromise;
  }

  private async onMessage(message: Message): Promise<void> {
    const {
      text,
      from: { id: userID },
    } = message;

    if (!this.scripts) {
      return;
    }

    const currentUserCatchPoint = this.userCatchPoints[userID];

    if (currentUserCatchPoint) {
      const result = await currentUserCatchPoint.call(this, message);

      if (result === false) {
        return;
      }

      delete this.userCatchPoints[userID];
    }

    const currentUserScriptPoint =
      this.userScriptsPoints[userID] || this.scripts;
    const script = currentUserScriptPoint[text] || currentUserScriptPoint['*'];

    if (!script) {
      return;
    }

    if (typeof script === 'function') {
      this.userScriptsPoints[userID] = await script.call(this, message);
      return;
    }

    this.sendMessage(userID, script.text, script.keyboard);
    this.userCatchPoints[userID] = script.catchMessage;
    this.userScriptsPoints[userID] = script.onText;
  }
}
