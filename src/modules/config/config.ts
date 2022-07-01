import input from '@utils/input';

import { DEFAULT_SETTINGS, DEFAULT_TELEGRAM_CREDENTIALS } from './settings';

import type Store from '@modules/store';
import type { StoreData } from './types';
import type { InitParams, Settings } from './types';

export const SECTION_LENGTH = 10;

export class Config {
  public settings: Settings;
  public credentials: StoreData<any>['credentials'];

  private store: Store<StoreData<any>>;

  constructor(params: InitParams) {
    const { store } = params;

    this.store = store;
  }

  public async initConfig(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...this.store.store.settings,
    };

    await this.initTelegramCredentials();

    await this.store.update({
      settings: this.settings,
      credentials: this.credentials,
    });
  }

  public updateSettings(data: Partial<Settings>): void {
    this.settings = {
      ...this.settings,
      ...data,
    };

    this.store.update({
      settings: this.settings,
    });
  }

  private async initWrapper(
    name: string,
    func: () => Promise<void>
  ): Promise<void> {
    const section =
      name +
      (name.length < SECTION_LENGTH
        ? ' '.repeat(SECTION_LENGTH - name.length)
        : '');

    console.log(`==== ${section} ====`);
    await func();
    console.log('='.repeat(SECTION_LENGTH + 10));
  }

  /* <Telegram-settings managers> */

  private async initTelegramCredentials(): Promise<void> {
    this.credentials = {
      ...DEFAULT_TELEGRAM_CREDENTIALS,
      ...this.store.store.credentials,
    };

    if (!this.credentials.token) {
      return this.initWrapper('Telegram', async () => {
        this.credentials.token = await input('Telegram token: ');
      });
    }
  }

  public updateTelegramCredentials(
    data: Partial<StoreData<any>['credentials']>
  ): void {
    this.credentials = {
      ...this.credentials,
      ...data,
    };

    this.store.update({
      credentials: this.credentials,
    });
  }

  /* </Telegram-settings managers> */
}
