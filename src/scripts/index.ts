import createAdminScripts from './adminScripts';
import createStartScript from './startScript';

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

  const adminAccess = (uid: number) => users.checkAccess(uid, Permitions.admin);

  const mainMenu: Keyboard = [
    [{ text: Commands.AdminPanel, checkAccess: adminAccess }],
    [{ text: Commands.PersonalAccount }],
  ];

  telegram.configureScripts({
    [Commands.Start]: createStartScript.call(this, mainMenu),
    [Commands.AdminPanel]: createAdminScripts.call(this, mainMenu),
    [Commands.PersonalAccount]: {
      text: 'Здесь пока ничего нет',
      keyboard: mainMenu,
    },
    [Commands.Any]: {
      text: 'Прости, я тебя не поняла 😔',
      keyboard: mainMenu,
    },
  });
}

export default applyScripts;
