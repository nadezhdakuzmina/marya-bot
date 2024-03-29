import type { Message } from 'node-telegram-bot-api';

export interface Config {
  credentials: {
    token: string;
  };
  settings: {
    sendMessageDelay: number;
  };
}

export type ScriptFunc = (
  message: Message
) => Scripts | Promise<Scripts | undefined> | void;

export type CatchMessageFunc = (message: Message) => false | void;

export interface TextScript {
  text: string;
  keyboard?: Keyboard;
  onText?: Scripts;
  catchMessage?: CatchMessageFunc;
}

export type Script = ScriptFunc | TextScript;

export interface Scripts {
  [key: string]: Script;
}

export interface UserScriptsPoints {
  [uid: number]: Scripts;
}

export interface UserCatchPoints {
  [uid: number]: CatchMessageFunc;
}

export interface KeyboardButton {
  text: string;
  checkAccess?: (uid: number) => boolean;
}

export type Keyboard = KeyboardButton[][];
