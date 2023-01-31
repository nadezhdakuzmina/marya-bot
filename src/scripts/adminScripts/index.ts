import renderList from '@utils/renderList';

import createCaptureProcedureScript from './captureProcedure';
import createFindUserScript from './findUser';
import createSaleControls from './saleControls';
import createSpammer from './spammer';
import createUserListScript from './usersList';

import type { Keyboard, Script, Scripts } from '@modules/core';
import type { Context } from '../types';
import type { CreateScriptParams } from './types';

enum Commands {
  UsersList = 'Список клиентов',
  CaptureProcedure = 'Записать процедуру',
  FindUser = 'Найти клиента',
  SaleControls = 'Управление скидками',
  MakeSpamMessage = 'Сделать рассылку',
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
      Commands.SaleControls,
    ]) +
    '\n\n' +
    `${Commands.GoBack}`;

  const startMessage = '*Добро пожаловать в админ-панель!*\n' + helpMessage;

  const adminMenu: Keyboard = [
    [{ text: Commands.UsersList }],
    [{ text: Commands.FindUser }],
    [{ text: Commands.CaptureProcedure }],
    [{ text: Commands.SaleControls }],
    [{ text: Commands.MakeSpamMessage }],
    [{ text: Commands.GoBack }],
  ];

  const scripts: Scripts = {};

  const context: CreateScriptParams = {
    scripts,
    helpMessage,
    adminMenu,
    users,
  };

  (scripts[Commands.UsersList] = createUserListScript(context)),
    (scripts[Commands.FindUser] = createFindUserScript(context)),
    (scripts[Commands.CaptureProcedure] =
      createCaptureProcedureScript(context)),
    (scripts[Commands.SaleControls] = createSaleControls.call(this, context)),
    (scripts[Commands.MakeSpamMessage] = createSpammer(context));
  scripts[Commands.GoBack] = {
    text: 'Главное меню',
    keyboard: mainMenu,
  };
  scripts[Commands.Any] = {
    text: 'Я тебя не поняла',
    keyboard: mainMenu,
  };

  return {
    text: startMessage,
    keyboard: adminMenu,
    onText: scripts,
  };
}

export default createAdminScript;
