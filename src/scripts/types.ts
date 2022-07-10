import type Config from '@modules/config';
import type TelegramCore from '@modules/core';
import type Users from '@modules/users';

export interface Context {
  config: Config;
  users: Users;
  telegram: TelegramCore;
}
