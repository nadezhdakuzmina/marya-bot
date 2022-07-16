/* import { onStart } from './onStart';
import { onUnknownMessage } from './onUnknownMessage';
import { adminPanelThread } from './adminPanel'; */
import createAdminScript from './adminScript';
import createStartScript from './startScript';

import { Permitions } from '@modules/users';

import type { Keyboard } from '@modules/core';
import type { Context } from './types';

enum Commands {
  start = '/start',
  adminPanel = 'Админ-панель',
  personalAccount = 'Личный аккаунт',
  unknownMessage = '*',
}

function applyScripts(this: Context) {
  const { telegram, users } = this;

  const adminAccess = (uid: number) => users.checkAccess(uid, Permitions.admin);

  const mainMenu: Keyboard = [
    [{ text: Commands.adminPanel, checkAccess: adminAccess }],
    [{ text: Commands.personalAccount }],
  ];

  telegram.configureScripts({
    [Commands.start]: createStartScript.call(this, mainMenu),
    [Commands.adminPanel]: createAdminScript.call(this, mainMenu),
    [Commands.personalAccount]: {
      text: 'Здесь пока ничего нет',
      keyboard: mainMenu,
    },
    [Commands.unknownMessage]: {
      text: 'Прости, я тебя не поняла 😔',
      keyboard: mainMenu,
    },
  });
}

export default applyScripts;
