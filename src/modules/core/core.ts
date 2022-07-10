import TelegramBot from 'node-telegram-bot-api';

import timeout from '@utils/timeout';

import type { ChatType, Message } from 'node-telegram-bot-api';
import type {
  Config,
  CallbackResponse,
  MessageCallback,
  MessageCallbacks,
  Scripts,
} from './types';

export class TelegramCore {
  private config: Config;
  private client: TelegramBot;
  private activeMessageCallbacks: MessageCallbacks;
  private activePromise: Promise<void>;
  private scripts: Scripts;

  constructor(config: Config) {
    this.config = config;

    const { token } = config.credentials;
    this.client = new TelegramBot(token, { polling: true });

    this.activeMessageCallbacks = {};
    this.scripts = {};

    this.client.on('polling_error', console.error);
    this.client.on('message', this.onMessage.bind(this));

    console.log('Telegram bot started!');
  }

  private async queue<T>(func: () => Promise<T>): Promise<T> {
    const { sendMessageDelay } = this.config.settings;

    const currPromise = new Promise<T>(
      async (resolve) => {
        if (this.activePromise) {
          await this.activePromise;
        }

        resolve(func());
      }
    );

    this.activePromise = currPromise
      .then(() => timeout(sendMessageDelay));

    return currPromise;
  }

  public async sendMessage(chatID: number, message: string): Promise<number> {
    return this.queue(() => this.client
      .sendMessage(chatID, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      })
      .then(({ message_id }) => message_id)
      .catch(({ code }) => {
        console.error(code);
        return null;
      })
    );
  }

  public updateMessage(
    chatID: number,
    messageID: number,
    message: string
  ): Promise<boolean> {
    return this.queue(() => this.client
      .editMessageText(message, {
        chat_id: chatID,
        message_id: messageID,
        parse_mode: 'Markdown',
      })
      .then(() => true)
      .catch(({ code }) => {
        console.error(code);
        return false;
      })
    );
  }

  public setResponseCallback(
    message: Message,
    callback: MessageCallback,
    chatTypeOrID: ChatType | number | '*' = 'private'
  ): void {
    const {
      from: { id: userID },
    } = message;

    const createCallback = (currentCallback: MessageCallback) =>
      async (responseMessage: Message) => {
        if (
          chatTypeOrID !== '*' &&
          ((typeof chatTypeOrID === 'string' &&
            responseMessage.chat.type !== chatTypeOrID) ||
            (typeof chatTypeOrID === 'number' &&
              responseMessage.chat.id !== chatTypeOrID))
        ) {
          return;
        }

        return currentCallback.call(this, responseMessage);
      };

    this.activeMessageCallbacks[userID] = createCallback(callback);
  }

  public removeResponseCallback(message: Message): void  {
    const {
      from: { id: userID },
    } = message;

    delete this.activeMessageCallbacks[userID];
  }

  private async callResponseCallback(message: Message): Promise<void> {
    const {
      from: { id: userID },
    } = message;

    this.activeMessageCallbacks[userID] = new Promise(async (resolve) => {
      const response: CallbackResponse = await this.activeMessageCallbacks[
        userID
      ];

      if (typeof response === 'function') {
        const call = await response(message);
        resolve(call);
      }
    });
  }

  private async onMessage(message: Message): Promise<void> {
    const { text } = message;

    const scriptFunction = this.scripts[text];
    if (scriptFunction) {
      scriptFunction(message);
      return;
    }

    this.callResponseCallback(message);
  }

  public configureScript(name: string, scriptFunction?: MessageCallback) {
    this.scripts[name] = scriptFunction.bind(this);
  }
}