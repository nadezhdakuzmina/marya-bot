import type { Message } from 'node-telegram-bot-api';

export interface Config {
  credentials: {
    token: string;
  }
  settings: {
    sendMessageDelay: number;
  }
}

export type CallbackResponse =
  | Promise<void | MessageCallback>
  | MessageCallback
  | void;

export interface MessageCallbacks {
  [key: number]: MessageCallback | Promise<CallbackResponse>;
}

export type MessageCallback = (message: Message) => CallbackResponse;

export interface Scripts {
  [key: string]: MessageCallback;
}

export type Keyboard = {
  text: string;
}[][];

export interface Thread {
  [uid: string]: Scripts;
}

export interface Keyboards {
  [name: string]: Keyboard;
}
