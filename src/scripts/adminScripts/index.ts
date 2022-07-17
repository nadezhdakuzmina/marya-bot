import renderList from '@utils/renderList';

import createCaptureProcedureScript from './captureProcedure';
import createFindUserScript from './findUser';
import createUserListScript from './usersList';

import type { Keyboard, Script, Scripts, TelegramCore } from '@modules/core';
import type { Context } from '../types';
import { CreateScriptParams } from './types';

enum Commands {
  UsersList = 'Список клиентов',
  CaptureProcedure = 'Записать процедуру',
  FindUser = 'Найти клиента',
  GoBack = '👈 Назад',
  Any = '*',
}

function createAdminScript(this: Context, mainMenu: Keyboard): Script {
  const { users } = this;

  const helpMessage =
    '*Ниже список доступных команд:*\n' +
    '\n' +
    renderList([
      Commands.UsersList,
      Commands.FindUser,
      Commands.CaptureProcedure,
    ]) +
    '\n\n' +
    `${Commands.GoBack}`;

  const startMessage = '*Добро пожаловать в админ-панель!*\n' + helpMessage;

  const adminMenu: Keyboard = [
    [{ text: Commands.UsersList }],
    [{ text: Commands.FindUser }],
    [{ text: Commands.CaptureProcedure }],
    [{ text: Commands.GoBack }],
  ];

  const context: CreateScriptParams = {
    scripts: {},
    helpMessage,
    adminMenu,
    users,
  };

  const scripts: Scripts = {
    [Commands.UsersList]: createUserListScript(context),
    [Commands.FindUser]: createFindUserScript(context),
    [Commands.CaptureProcedure]: createCaptureProcedureScript(context),
    [Commands.GoBack]: {
      text: 'Главное меню',
      keyboard: mainMenu,
    },
    [Commands.Any]: {
      text: 'Я тебя не поняла',
      keyboard: mainMenu,
    },
  };

  context.scripts = scripts;

  return {
    text: startMessage,
    keyboard: adminMenu,
    onText: scripts,
  };
}

export default createAdminScript;
