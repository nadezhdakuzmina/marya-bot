import TelegramBot from 'node-telegram-bot-api';

import timeout from '@utils/timeout';

import type { ChatType, Message } from 'node-telegram-bot-api';
import type {
  Config,
  CallbackResponse,
  MessageCallback,
  MessageCallbacks,
  Scripts,
  Keyboard,
  Thread,
  Keyboards,
} from './types';

export class TelegramCore {
  private config: Config;
  private client: TelegramBot;
  private activeMessageCallbacks: MessageCallbacks;
  private activePromise: Promise<void>;
  private scripts: Scripts;
  private threads: Thread;
  private keyboards: Keyboards;

  constructor(config: Config) {
    this.config = config;

    const { token } = config.credentials;
    this.client = new TelegramBot(token, { polling: true });

    this.activeMessageCallbacks = {};
    this.scripts = {};
    this.threads = {};
    this.keyboards = {};

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

  public async sendMessage(chatID: number, message: string, keyboard?: Keyboard): Promise<number> {
    return this.queue(() => this.client
      .sendMessage(chatID, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: keyboard ? {
          keyboard,
        } : {
          remove_keyboard: true,
        },
      })
      .then(({ message_id }) => message_id)
      .catch(({ response: { body: { description } } }) => {
        console.error(`Telegram Error: ${description}`);
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
      .catch(({ response: { body: { description } } }) => {
        console.error(`Telegram Error: ${description}`);
        return null;
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
    const {
      text,
      from: { id: userID },
    } = message;

    const threadScriptFunction = this.threads[userID]?.[text];
    if (threadScriptFunction) {
      const responseCallback = threadScriptFunction(message);
      if (responseCallback) {
        this.activeMessageCallbacks[userID] = responseCallback;
      }

      return;
    }

    const scriptFunction = this.scripts[text];

    if (scriptFunction) {
      const responseCallback = scriptFunction(message);
      if (responseCallback) {
        this.activeMessageCallbacks[userID] = responseCallback;
      }

      return;
    }

    this.callResponseCallback(message);
  }

  public createThread(message: Message) {
    const {
      from: { id: userID }
    } = message;

    if (!(userID in this.threads)) {
      this.threads[userID] = {};
    }

    return {
      add: ((name: string, scriptFunction?: MessageCallback) => {
        this.threads[userID][name] = scriptFunction.bind(this); 
      }),
      quit: (() => {
        delete this.threads[userID];
      }),
    }
  }

  public configureScript(name: string, scriptFunction?: MessageCallback) {
    this.scripts[name] = scriptFunction.bind(this);
  }

  public createKeyboard(name: string, keyboard: Keyboard): void {
    this.keyboards[name] = keyboard;
  }
}
