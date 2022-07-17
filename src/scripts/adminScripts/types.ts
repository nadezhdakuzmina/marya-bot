import type { Keyboard, Scripts } from '@modules/core';
import type Users from '@modules/users';

export interface CreateScriptParams {
  users: Users;
  helpMessage: string;
  adminMenu: Keyboard;
  scripts: Scripts;
}
