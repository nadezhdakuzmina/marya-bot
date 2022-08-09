import type { Keyboard, Scripts } from '@modules/core';
import type Users from '@modules/users';
import type { CreateUserData } from '@modules/users';

export interface CreateScriptParams {
  users: Users;
  helpMessage: string;
  userMenu: Keyboard;
  scripts: Scripts;
}

export interface UsersData {
  [uid: number]: Partial<CreateUserData>;
}
