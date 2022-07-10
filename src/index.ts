import Config from '@modules/config';
import Telegram from '@modules/core';
import Store from '@modules/store';

import { CONFIG_PATH } from '@constants';
import applyScripts from './scripts';

import type { StoreData as ConfigStoreData } from '@modules/config';
import { StoreData as UsersStoreData, Users } from '@modules/users';
import type { Message } from 'node-telegram-bot-api';

const store = new Store<ConfigStoreData & UsersStoreData>(CONFIG_PATH);

let config: Config;
let users: Users;
let telegram: Telegram;

store
  .load()
  .then(() => {
    config = new Config({ store });
    return config.initConfig();
  })
  .then(() => {
    users = new Users({ store, config });
    return users.initUsers();
  })
  .then(async () => {
    telegram = new Telegram(config);

    const context = {
      telegram,
      config,
      users,
    };

    applyScripts(context);
  });
