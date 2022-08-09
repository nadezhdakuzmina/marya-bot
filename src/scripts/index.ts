import createAdminScripts from './adminScripts';
import createStartScript from './startScript';
import createUserScripts from './userScripts';

import { Permitions } from '@modules/users';

import type { Keyboard } from '@modules/core';
import type { Context } from './types';

enum Commands {
  Start = '/start',
  AdminPanel = 'Админ-панель',
  PersonalAccount = 'Личный аккаунт',
  Any = '*',
}

function applyScripts(this: Context) {
  const { telegram, users } = this;

  const checkAdminAccess = (uid: number) =>
    users.checkAccess(uid, Permitions.admin);
  const checkIfAuthorized = (uid: number) => uid in users.users;
  const checkIfNotAuthorized = (uid: number) => !(uid in users.users);

  const mainMenu: Keyboard = [
    [{ text: Commands.AdminPanel, checkAccess: checkAdminAccess }],
    [{ text: Commands.PersonalAccount }],
  ];

  const notAuthorizedScript = {
    text: 'Ты не авторизован!\nПройти авторизацию - /start',
    keyboard: [[{ text: '/start' }]],
  };

  const notUnderstandScript = {
    text: 'Прости, я тебя не поняла 😔',
    keyboard: mainMenu,
  };

  const alreadyAuthorizedScript = {
    text: 'Ты уже авторизован!',
    keyboard: mainMenu,
  };

  telegram.configureScripts({
    [Commands.Start]: telegram.privateScript(
      createStartScript.call(this, mainMenu),
      alreadyAuthorizedScript,
      checkIfNotAuthorized
    ),
    [Commands.AdminPanel]: telegram.privateScript(
      createAdminScripts.call(this, mainMenu),
      notUnderstandScript,
      checkAdminAccess
    ),
    [Commands.PersonalAccount]: telegram.privateScript(
      createUserScripts.call(this, mainMenu),
      notAuthorizedScript,
      checkIfAuthorized
    ),
    [Commands.Any]: telegram.privateScript(
      notUnderstandScript,
      notAuthorizedScript,
      checkIfAuthorized
    ),
  });
}

export default applyScripts;
