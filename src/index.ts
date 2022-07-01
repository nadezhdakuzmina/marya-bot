import Store from '@modules/store';
import Config from '@modules/config';
import Telegram from '@modules/core';

import { CONFIG_PATH } from '@constants';

import type { StoreData } from '@modules/config';
import type { UserData } from '@types';
import type { Message } from 'node-telegram-bot-api';

const configStore = new Store<StoreData<UserData>>(CONFIG_PATH);

let config: Config;
let telegram: Telegram;

configStore.load()
  .then(() => {
    config = new Config({ store: configStore });
    return config.initConfig();
  })
  .then(async () => {
    telegram = new Telegram(config);

    telegram.configureScript('Привет!', function (message: Message) {
      this.sendMessage(message.from.id, 'Скажи как тебя зовут!');

      this.setResponseCallback(message, function (responseMessage: Message) {
        this.sendMessage(message.from.id, `Тебя зовут ${responseMessage.text}`);
      })
    })
  });
